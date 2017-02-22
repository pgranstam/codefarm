"use strict";

const fs = require("fs-extra-promise");
const path = require("path");

module.exports = async (argv) => {
    const flowIdTag = `step:flow:${argv.id}`;

    const defaultCollector = (
        criteria,
        limit = 1,
        name = "commits",
        collectType = "coderepo.revision"
    ) => {
        return {
            name: name,
            collectType: collectType,
            criteria: criteria,
            limit: limit,
            latest: false
        };
    };

    const defaultBlSpec = (
        name,
        script = false,
        slaveCriteria = false,
        tagScript = false,
        parentStepNames = [],
        visible = true
    ) => {
        return {
            name: name,
            flow: {
                _ref: true,
                id: argv.id,
                type: "flowctrl.flow"
            },
            concurrency: 1,
            baseline: {
                _ref: true,
                id: name, // Use baseline with same name as step
                type: "baselinegen.specification"
            },
            criteria: slaveCriteria,
            script: script,
            tagScript: tagScript,
            parentStepNames: parentStepNames,
            visible: visible
        };
    };

    const tagBlSpec = (
        name,
        tagScript = false,
        parentStepNames = [],
        visible = true
    ) => defaultBlSpec(name, false, false, tagScript, parentStepNames, visible);

    const slaveScriptBlSpec = (
        name,
        script = false,
        slaveCriteria = false,
        parentStepNames = [],
        visible = true
    ) => defaultBlSpec(name, script, slaveCriteria, false, parentStepNames, visible);

    const baselineSpecs = [
        {
            _id: "Select",
            collectors: [
                defaultCollector(`!${flowIdTag}`)
            ]
        }, {
            _id: "CG",
            collectors: [
                defaultCollector(`${flowIdTag} AND !step:CG:success`)
            ]
        }, {
            _id: "Merge",
            collectors: [
                defaultCollector(`${flowIdTag} AND step:CG:success AND !step:Merge:success`)
            ]
        }
    ];

    const cgScript = await fs.readFileAsync(path.join(__dirname, "..", "jobs", "clone_and_test_cf.sh"), { encoding: "utf8" });
    const mergeScript = await fs.readFileAsync(path.join(__dirname, "..", "jobs", "merge_github_revision.sh"), { encoding: "utf8" });

    const defaultSlaveCriteria = "slave1";

    const steps = [
        tagBlSpec(
            "Select", `tags.push("${flowIdTag}");`, [], false
        ),
        slaveScriptBlSpec(
            "CG", cgScript, defaultSlaveCriteria
        ),
        slaveScriptBlSpec(
            "Merge", mergeScript, defaultSlaveCriteria, [ "CG" ]
        )
    ];

    return {
        flow: {
            _id: argv.id,
            description: `Flow with id ${argv.id}`
        },
        specifications: baselineSpecs,
        steps: steps
    };
};