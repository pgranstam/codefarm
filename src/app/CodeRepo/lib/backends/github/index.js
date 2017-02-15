"use strict";

const { ServiceMgr } = require("service");
const rp = require("request-promise");
const moment = require("moment");
const { AsyncEventEmitter } = require("emitter");
const GithubEventEmitter = require("./github_event_emitter");

const GITHUB_API_BASE = "https://api.github.com";
const GITHUB_BASE = "https://github.com";

/*
To get started with github:
1. Create a new user to use as integrator for the user/organization.
2. Setup a personal token for that user in GitHub 'Settings'
2.1 Make sure the 'repo' and 'admin:repo_hook' categories are checked
2.2 If you want to be able to delete repositories also check 'delete_repo'
3. Create the backend in the UI, provide the token and other data

Creating a new GitHub backend:
1. As the GitHub backend makes use of webhooks for events, a unique local port
   needs to be reachable from the github server for every started GitHub
   backend, alternatively port forwarding set up.
2. Use the UI to create the new repository, with:
   * target <- either a username or organization name
   * isOrganization <- flag to indicate if target is organization
   * authUser <- username previously created as integrator
   * authToken <- token previously created in integrator account
   * webHookUrl <- reachable HTTPS URL for webhook events from GitHub servers
   * port <- local port which will host a webserver listening to webhook events
3. Under repository settings, only allow merge squash under "Merge button"

Example configuration:
    target -> "Combitech"
    isOrganization -> true
    authUser -> "ebbqeadm"
    authToken -> "faded42f502fbad3d88034751d9c847552d3b9b4"
    webHookURL -> "https://secor.runge.se"
    port -> 3000

    The above will create a GitHub backend with new repositories created in
    the Combitech organization space. Operations will be authenticated as
    "ebbqeadm" and use the provided token. Webhooks will be set up so that
    events are sent to "https://secor.runge.se" and a web server started
    locally on port 3000 listening for these events. In the above example
    we have also previously set up port forwarding from secor.runge.se to
    the local machine.
*/

class GithubBackend extends AsyncEventEmitter {
    constructor(id, backend, Repository, Revision) {
        super();
        this.id = id;
        this.backend = backend;
        this.locks = {};
        this.Repository = Repository;
        this.Revision = Revision;

        this.githubEmitter = new GithubEventEmitter();
    }

    async start() {
        // Start event monitoring towards github
        try {
            const result = await this._startMonitorEventStream();
            ServiceMgr.instance.log("verbose", result);
        } catch (err) {
            ServiceMgr.instance.log("error", `Failed to setup GitHub webhook server: ${err}`);
        }
    }

    async validateRepository(/* event, data */) {
        // TODO: Validate gerrit specific options
    }

    async _onPing(event) {
        ServiceMgr.instance.log("verbose", "ping event received");
        ServiceMgr.instance.log("debug", JSON.stringify(event, null, 2));
    }

    _createPullReqRef(email, event, overrideSha = null) {
        return {
            index: 1,
            email: email,
            name: event.pull_request.user.login,
            submitted: moment(event.pull_request.created_at).utc().format(),
            comment: event.pull_request.title,
            pullreqnr: event.pull_request.number,
            change: {
                oldrev: event.pull_request.base.sha,
                newrev: overrideSha ? overrideSha : event.pull_request.head.sha,
                refname: event.pull_request.head.ref
            }
        };
    }

    async _createPullReqRevision(event, overrideSha = null) {
        const repositoryName = event.repository.name;
        const repository = await this.Repository.findOne({ _id: repositoryName });
        if (repository) {
            const pullReqId = event.pull_request.id.toString();
            const changeSha = overrideSha ? overrideSha : event.pull_request.head.sha;
            const email = await this._getCommitEmail(repositoryName, changeSha);
            const ref = this._createPullReqRef(email, event, overrideSha);
            ServiceMgr.instance.log("debug", `Created revision ref ${ref}`);
            ServiceMgr.instance.log("verbose", `GitHub revision/patch added for pull request: ${pullReqId}`);

            return await this.Revision.allocate(repository._id, pullReqId, ref);
        }
    }

    // TODO: Find a better way for this, resolving is dependant on user having pushed in last 30 events
    // This is a shot at resolving the username on a review by listing the user events
    async _getUserEmail(userName) {
        const url = `${GITHUB_API_BASE}/users/${userName}/events/public`;
        try {
            const result = await this._sendRequest(url, {}, "GET");
            for (const event of result) {
                if (event.type && event.type === "PushEvent" && event.payload && event.payload.commits) {
                    for (const commit of event.payload.commits) {
                        if (commit.author.name === userName) {
                            return commit.author.email;
                        }
                    }
                }
            }
        } catch (err) {
            ServiceMgr.instance.log("info", `Unable to retrieve events for username ${userName}:`);
        }

        ServiceMgr.instance.log("info", `Unable to get email for username ${userName}:`);

        return null;
    }

    async _getCommitEmail(repositoryName, commitSha) {
        const url = `${GITHUB_API_BASE}/repos/${this.backend.target}/${repositoryName}/commits/${commitSha}`;
        try {
            const result = await this._sendRequest(url, {}, "GET");

            return result.commit.author.email;
        } catch (err) {
            ServiceMgr.instance.log("info", `Unable to get email for ${repositoryName}:${commitSha}`);

            return null;
        }
    }

    async _getPullRequestMergeSha(repositoryName, pullReqNumber) {
        const uri = `${GITHUB_API_BASE}/repos/${this.backend.target}/${repositoryName}/issues/${pullReqNumber}/events`;
        try {
            const events = await this._sendRequest(uri, {}, "GET");
            for (const event of events) {
                if (event.event === "merged") {
                    return event.commit_id;
                }
            }
        } catch (err) {
            ServiceMgr.instance.log("error", `Failed to get merge SHA for repo ${repositoryName} pull request ${pullReqNumber}: ${err}`);

            return null;
        }
    }

    async _onPullRequestOpen(event) {
        ServiceMgr.instance.log("verbose", "pull_request_open received");
        ServiceMgr.instance.log("debug", JSON.stringify(event, null, 2));

        await this._createPullReqRevision(event);
    }

    async _onPullRequestUpdate(event) {
        ServiceMgr.instance.log("verbose", "pull_request_update received");
        ServiceMgr.instance.log("debug", JSON.stringify(event, null, 2));

        // This will create a new patch on existing revision
        await this._createPullReqRevision(event);
    }

    async _onPullRequestClose(event) {
        ServiceMgr.instance.log("verbose", "pull-request-closed received");
        ServiceMgr.instance.log("debug", JSON.stringify(event, null, 2));

        if (event.pull_request.merged === true) {
            const mergeSha = await this._getPullRequestMergeSha(event.repository.name, event.pull_request.number);
            // Will create a new patch on existing revision, Override pull request SHA
            const revision = await this._createPullReqRevision(event, mergeSha);
            revision.setMerged();
            await this.emit("revision.merged", revision);
            ServiceMgr.instance.log("verbose", `GitHub event merged revision ${event.pull_request.id}`);
        }
    }

    async _onPush(event) {
        ServiceMgr.instance.log("verbose", "push received");
        ServiceMgr.instance.log("debug", JSON.stringify(event, null, 2));

        const pullreqrev = await this.Revision.findOne({ "patches.change.newrev": event.head_commit.id });
        if (pullreqrev) {
            ServiceMgr.instance.log("verbose", "Ignored push initiated by pull request merge");

            return;
        }

        // TODO: List of special branches
        if (event.ref === "refs/heads/master") {
            const repositoryName = event.repository.name;
            const repository = await this.Repository.findOne({ _id: repositoryName });
            if (repository) {
                for (const commit of event.commits) {
                    const ref = {
                        index: 1,
                        email: commit.author.email,
                        name: commit.author.name,
                        submitted: commit.timestamp,
                        comment: commit.message,
                        change: {
                            oldrev: null, // TODO: set this
                            newrev: commit.id,
                            refname: commit.id // Use event.refName all the time instead?
                        }
                    };
                    const revision = await this.Revision.allocate(repository._id, commit.id, ref);
                    await revision.setMerged();
                    await this.emit("revision.merged", revision);
                }
                ServiceMgr.instance.log("verbose", `Push created ${event.commits.length} revisions as merged`);
            }
        } else {
            ServiceMgr.instance.log("verbose", `Ignored push to personal branch ${event.ref}`);
        }
    }

    async _onPullRequestReview(event) {
        ServiceMgr.instance.log("verbose", "pull_request_review received");
        ServiceMgr.instance.log("debug", JSON.stringify(event, null, 2));
        ServiceMgr.instance.log("verbose", `Review ${event.review.state} for ${event.pull_request.id}`);

        const repository = await this.Repository.findOne({ _id: event.repository.name });
        if (repository) {
            const revision = await this.Revision.findOne({ _id: event.pull_request.id.toString() });
            if (revision) {
                const userEmail = await this._getUserEmail(event.review.user.login);
                console.log("email:", userEmail);
                const state = event.review.state;
                if (state === "commented") {
                    await revision.addReview(userEmail, this.Revision.ReviewState.NEUTRAL);
                } else if (state === "changes_requested") {
                    await revision.addReview(userEmail, this.Revision.ReviewState.REJECTED);
                } else if (state === "approved") {
                    await revision.addReview(userEmail, this.Revision.ReviewState.APPROVED);
                } else {
                    ServiceMgr.instance.log("verbose", `unknown review state ${state} on ${revision._id}`);
                }
            }
        }
    }

    async _startMonitorEventStream() {
        this.githubEmitter.addListener("ping", this._onPing.bind(this));
        this.githubEmitter.addListener("pull_request_opened", this._onPullRequestOpen.bind(this));
        this.githubEmitter.addListener("pull_request_updated", this._onPullRequestUpdate.bind(this));
        this.githubEmitter.addListener("pull_request_closed", this._onPullRequestClose.bind(this));
        this.githubEmitter.addListener("pull_request_review", this._onPullRequestReview.bind(this));
        this.githubEmitter.addListener("push", this._onPush.bind(this));

        return await this.githubEmitter.start(this.backend.port);
    }

    async _createWebHook(repository) {
        ServiceMgr.instance.log("verbose", `Creating GitHub webhooks on ${repository._id}`);
        const uri = `${GITHUB_API_BASE}/repos/${this.backend.target}/${repository._id}/hooks`;
        const data = {
            "name": "web",
            "active": true,
            "events": [ "pull_request", "pull_request_review", "push" ],
            "config": {
                "url": this.backend.webhookURL,
                "content_type": "json"
            }
        };

        await this._sendRequest(uri, data);
    }

    async _sendRequest(uri, body, method = "POST") {
        const auth = Buffer.from(`${this.backend.authUser}:${this.backend.authToken}`).toString("base64");
        const options = {
            method: method,
            uri: uri,
            headers: {
                "User-Agent": "Code Farm",
                "Authorization": `Basic ${auth}`
            },
            body: body,
            json: true // Automatically stringifies the body to JSON
        };

        return rp(options);
    }

    async create(repository) {
        ServiceMgr.instance.log("verbose", `Creating GitHub repo ${repository._id}`);

        let uri;
        if (this.backend.isOrganization) {
            uri = `${GITHUB_API_BASE}/orgs/${this.backend.target}/repos`;
        } else {
            uri = `${GITHUB_API_BASE}/user/repos`;
        }
        const data = {
            "name": repository._id,
            "auto_init": true
        };

        try {
            await this._sendRequest(uri, data);
        } catch (err) {
            // Handle repo exist error and connect to repo instead
            if (err.name === "StatusCodeError" && err.statusCode === 422 &&
                err.error.errors[0].message === "name already exists on this account") {
                ServiceMgr.instance.log("verbose", `Connecting to existing GitHub repo ${repository._id}`);
            } else {
                ServiceMgr.instance.log("verbose", `Error creating GitHub repo ${repository._id}: ${err.message}`);
            }
        }

        try {
            await this._createWebHook(repository);
        } catch (err) {
            ServiceMgr.instance.log("verbose", `Error creating GitHub repo ${repository._id} webhook: ${err.message}`);
        }
    }

    async merge(repository, revision) {
        ServiceMgr.instance.log("verbose", `GitHub merge pull request ${revision._id} in ${repository._id}`);
        const ref = revision.patches[revision.patches.length - 1];
        const uri = `${GITHUB_API_BASE}/repos/${this.backend.target}/${repository._id}/pulls/${revision._id}/merge`;
        const data = {
            "sha": ref.change.newrev,
            "merge_method": "squash"
        };

        try {
            await this._sendRequest(uri, data, "PUT");
        } catch (err) {
            ServiceMgr.instance.log("error", `Error merging in repository: ${repository._id} sha: ${ref.change.newrev}`);
        }
    }

    async getUri(backend, repository) {
        return `${GITHUB_BASE}/${this.backend.target}/${repository._id}`;
    }


    async update(/* repository */) {
        // TODO: Implement update
    }

    async remove(repository) {
        ServiceMgr.instance.log("verbose", `Deleting GitHub repo ${repository._id}`);
        try {
            await this._sendRequest(`${GITHUB_API_BASE}/repos/${this.backend.target}/${repository._id}`, {}, "DELETE");
        } catch (err) {
            ServiceMgr.instance.log("verbose", `Error deleting GitHub repo ${repository._id}: ${err.message}`);
        }
    }

    async dispose() {
        this.removeAllListeners();
        this.githubEmitter.removeAllListeners();
        await this.githubEmitter.dispose();
    }
}

module.exports = GithubBackend;
