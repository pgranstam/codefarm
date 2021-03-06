
import React from "react";
import PropTypes from "prop-types";
import LightComponent from "ui-lib/light_component";
import Input from "react-toolbox/lib/input";
import Dropdown from "react-toolbox/lib/dropdown";
import Autocomplete from "react-toolbox/lib/autocomplete";
import Checkbox from "react-toolbox/lib/checkbox";
import {
    Form as TAForm,
    Section as TASection,
    utils as tautils
} from "ui-components/type_admin";
import { default as UUID } from "uuid";

const BACKEND_TYPE = {
    GERRIT: "gerrit",
    GITHUB: "github",
    GITLAB: "gitlab",
    BITBUCKET: "bitbucket"
};

class Edit extends LightComponent {
    constructor(props) {
        super(props);

        const webhookSecret = UUID.v4();

        this.itemProperties = {
            "_id": {
                editable: false,
                required: () => true,
                defaultValue: ""
            },
            "tags": {
                editable: true,
                required: () => false,
                defaultValue: []
            },
            "backendType": {
                editable: false,
                required: () => true,
                defaultValue: BACKEND_TYPE.GERRIT
            },
            "uri": {
                editable: true,
                required: () => this.state.backendType.value === BACKEND_TYPE.GERRIT,
                defaultValue: "ssh://admin@localhost:29418"
            },
            "privateKeyPath": {
                editable: true,
                required: () => this.state.backendType.value === BACKEND_TYPE.GERRIT,
                defaultValue: ""
            },
            "serverUrl": {
                editable: true,
                required: () => this.state.backendType.value in [ BACKEND_TYPE.GITLAB, BACKEND_TYPE.BITBUCKET ],
                defaultValue: "https://gitlab.com"
            },
            "target": {
                editable: true,
                required: () => this.state.backendType.value in [ BACKEND_TYPE.GITHUB, BACKEND_TYPE.GITLAB, BACKEND_TYPE.BITBUCKET ],
                defaultValue: ""
            },
            "isOrganization": {
                editable: true,
                required: () => this.state.backendType.value === BACKEND_TYPE.GITHUB,
                defaultValue: true
            },
            "authUser": {
                editable: true,
                required: () => this.state.backendType.value in [ BACKEND_TYPE.GITHUB, BACKEND_TYPE.BITBUCKET ],
                defaultValue: ""
            },
            "authToken": {
                editable: true,
                required: () => this.state.backendType.value in [ BACKEND_TYPE.GITHUB, BACKEND_TYPE.GITLAB, BACKEND_TYPE.BITBUCKET ],
                defaultValue: ""
            },
            "webhookURL": {
                editable: true,
                required: () => this.state.backendType.value in [ BACKEND_TYPE.GITHUB, BACKEND_TYPE.GITLAB ],
                defaultValue: ""
            },
            "webhookSecret": {
                editable: false,
                required: () => this.state.backendType.value in [ BACKEND_TYPE.GITHUB, BACKEND_TYPE.GITLAB ],
                defaultValue: `${webhookSecret}`
            },
            "port": {
                editable: true,
                required: () => this.state.backendType.value in [ BACKEND_TYPE.GITHUB, BACKEND_TYPE.GITLAB, BACKEND_TYPE.BITBUCKET ],
                defaultValue: ""
            }
        };

        this.state = tautils.createStateProperties(this, this.itemProperties, this.props.item);
    }

    getBackendTypes() {
        return [
            { value: BACKEND_TYPE.GERRIT, label: "Gerrit" },
            { value: BACKEND_TYPE.GITHUB, label: "GitHub" },
            { value: BACKEND_TYPE.GITLAB, label: "GitLab" },
            { value: BACKEND_TYPE.BITBUCKET, label: "BitBucket" }
        ];
    }

    async onConfirm() {
        const data = tautils.serialize(this.state, this.itemProperties, this.props.item);
        await this.props.onSave("coderepo.backend", data, {
            create: !this.props.item
        });
    }

    render() {
        console.log("EditLocal-RENDER", this.props, this.state);

        const backendTypes = this.getBackendTypes();

        return (
            <TASection
                breadcrumbs={this.props.breadcrumbs}
                controls={this.props.controls}
                menuItems={this.props.menuItems}
            >
                <TAForm
                    confirmAllowed={tautils.isValid(this.state, this.itemProperties)}
                    confirmText={this.props.item ? "Save" : "Create"}
                    primaryText={`${this.props.item ? "Edit" : "Create"} code repository backend`}
                    secondaryText="A code repository backend contains information about..."
                    onConfirm={() => this.onConfirm()}
                    onCancel={() => this.props.onCancel()}
                >
                    <Input
                        type="text"
                        label="Name"
                        name="_id"
                        floating={true}
                        required={this.itemProperties._id.required()}
                        disabled={this.props.item && !this.itemProperties._id.editable}
                        value={this.state._id.value}
                        onChange={this.state._id.set}
                    />
                    <Dropdown
                        label="Backend type"
                        required={this.itemProperties.backendType.required()}
                        disabled={this.props.item && !this.itemProperties.backendType.editable}
                        onChange={this.state.backendType.set}
                        source={backendTypes}
                        value={this.state.backendType.value}
                    />
                    <Choose>
                        <When condition={this.state.backendType.value === BACKEND_TYPE.GERRIT}>
                            <Input
                                type="url"
                                label="URI to use when connecting to gerrit"
                                name="uri"
                                floating={true}
                                required={this.itemProperties.uri.required()}
                                disabled={this.props.item && !this.itemProperties.uri.editable}
                                value={this.state.uri.value}
                                onChange={this.state.uri.set}
                            />
                            <Input
                                type="text"
                                label="Path to private key for the user specified in Gerrit URI"
                                name="privateKeyPath"
                                floating={true}
                                required={this.itemProperties.privateKeyPath.required()}
                                disabled={this.props.item && !this.itemProperties.privateKeyPath.editable}
                                value={this.state.privateKeyPath.value}
                                onChange={this.state.privateKeyPath.set}
                            />
                        </When>
                        <When condition={this.state.backendType.value === BACKEND_TYPE.GITHUB}>
                            <Input
                                type="text"
                                label="GitHub target (organization or user)"
                                name="target"
                                floating={true}
                                required={this.itemProperties.target.required()}
                                disabled={this.props.item && !this.itemProperties.target.editable}
                                value={this.state.target.value}
                                onChange={this.state.target.set}
                            />
                            <Checkbox
                                type="text"
                                label="Target is an organization"
                                name="isOrganization"
                                required={this.itemProperties.isOrganization.required()}
                                disabled={this.props.item && !this.itemProperties.isOrganization.editable}
                                checked={this.state.isOrganization.value}
                                onChange={this.state.isOrganization.set}
                            />
                            <Input
                                type="text"
                                label="Github user to authenticate as"
                                name="authUser"
                                floating={true}
                                required={this.itemProperties.authUser.required()}
                                disabled={this.props.item && !this.itemProperties.authUser.editable}
                                value={this.state.authUser.value}
                                onChange={this.state.authUser.set}
                            />
                            <Input
                                type="text"
                                label="GitHub user authentication token"
                                name="authToken"
                                floating={true}
                                required={this.itemProperties.authToken.required()}
                                disabled={this.props.item && !this.itemProperties.authToken.editable}
                                value={this.state.authToken.value}
                                onChange={this.state.authToken.set}
                            />
                            <Input
                                type="url"
                                label="Webhook callback URL"
                                name="webhookURL"
                                floating={true}
                                required={this.itemProperties.webhookURL.required()}
                                disabled={this.props.item && !this.itemProperties.webhookURL.editable}
                                value={this.state.webhookURL.value}
                                onChange={this.state.webhookURL.set}
                            />
                            <Input
                                type="text"
                                label="Webhook secret"
                                name="webhookSecret"
                                floating={true}
                                required={this.itemProperties.webhookSecret.required()}
                                disabled={this.props.item && !this.itemProperties.webhookSecret.editable}
                                value={this.state.webhookSecret.value}
                                onChange={this.state.webhookSecret.set}
                            />
                            <Input
                                type="number"
                                label="Local port for webhooks"
                                name="port"
                                floating={true}
                                required={this.itemProperties.port.required()}
                                disabled={this.props.item && !this.itemProperties.port.editable}
                                value={this.state.port.value}
                                onChange={this.state.port.set}
                            />
                        </When>
                        <When condition={this.state.backendType.value === BACKEND_TYPE.GITLAB}>
                            <Input
                                type="text"
                                label="GitLab Server URL"
                                name="server"
                                floating={true}
                                required={this.itemProperties.serverUrl.required()}
                                disabled={this.props.item && !this.itemProperties.serverUrl.editable}
                                value={this.state.serverUrl.value}
                                onChange={this.state.serverUrl.set}
                            />
                            <Input
                                type="text"
                                label="GitLab group"
                                name="target"
                                floating={true}
                                required={this.itemProperties.target.required()}
                                disabled={this.props.item && !this.itemProperties.target.editable}
                                value={this.state.target.value}
                                onChange={this.state.target.set}
                            />
                            <Input
                                type="text"
                                label="GitLab user private token"
                                name="authToken"
                                floating={true}
                                required={this.itemProperties.authToken.required()}
                                disabled={this.props.item && !this.itemProperties.authToken.editable}
                                value={this.state.authToken.value}
                                onChange={this.state.authToken.set}
                            />
                            <Input
                                type="url"
                                label="Webhook callback URL"
                                name="webhookURL"
                                floating={true}
                                required={this.itemProperties.webhookURL.required()}
                                disabled={this.props.item && !this.itemProperties.webhookURL.editable}
                                value={this.state.webhookURL.value}
                                onChange={this.state.webhookURL.set}
                            />
                            <Input
                                type="text"
                                label="Webhook secret"
                                name="webhookSecret"
                                floating={true}
                                required={this.itemProperties.webhookSecret.required()}
                                disabled={this.props.item && !this.itemProperties.webhookSecret.editable}
                                value={this.state.webhookSecret.value}
                                onChange={this.state.webhookSecret.set}
                            />
                            <Input
                                type="number"
                                label="Local port for webhooks"
                                name="port"
                                floating={true}
                                required={this.itemProperties.port.required()}
                                disabled={this.props.item && !this.itemProperties.port.editable}
                                value={this.state.port.value}
                                onChange={this.state.port.set}
                            />
                        </When>
                        <When condition={this.state.backendType.value === BACKEND_TYPE.BITBUCKET}>
                            <Input
                                type="text"
                                label="BitBucket Project name"
                                name="target"
                                floating={true}
                                required={this.itemProperties.target.required()}
                                disabled={this.props.item && !this.itemProperties.target.editable}
                                value={this.state.target.value}
                                onChange={this.state.target.set}
                            />
                            <Input
                                type="text"
                                label="BitBucket user to authenticate as"
                                name="authUser"
                                floating={true}
                                required={this.itemProperties.authUser.required()}
                                disabled={this.props.item && !this.itemProperties.authUser.editable}
                                value={this.state.authUser.value}
                                onChange={this.state.authUser.set}
                            />
                            <Input
                                type="text"
                                label="BitBucket user password"
                                name="authToken"
                                floating={true}
                                required={this.itemProperties.authToken.required()}
                                disabled={this.props.item && !this.itemProperties.authToken.editable}
                                value={this.state.authToken.value}
                                onChange={this.state.authToken.set}
                            />
                            <Input
                                type="number"
                                label="Local port for webhooks"
                                name="port"
                                floating={true}
                                required={this.itemProperties.port.required()}
                                disabled={this.props.item && !this.itemProperties.port.editable}
                                value={this.state.port.value}
                                onChange={this.state.port.set}
                            />
                        </When>
                    </Choose>
                    <Autocomplete
                        selectedPosition="below"
                        allowCreate={true}
                        label="Tags"
                        disabled={this.props.item && !this.itemProperties.tags.editable}
                        onChange={this.state.tags.set}
                        source={this.state.tags.value}
                        value={this.state.tags.value}
                    />
                </TAForm>
            </TASection>
        );
    }
}

Edit.propTypes = {
    theme: PropTypes.object,
    item: PropTypes.object,
    pathname: PropTypes.string.isRequired,
    breadcrumbs: PropTypes.array.isRequired,
    controls: PropTypes.array.isRequired,
    menuItems: PropTypes.array.isRequired,
    onSave: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired
};

export default Edit;
