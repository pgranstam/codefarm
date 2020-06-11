"use strict";

const rp = require("request-promise");
const yargs = require("yargs");
const {
    flowctrl: configFlowCtrl,
    baselinegen: configBaselineGen
} = require("./config.json");

const argv = yargs
.usage("Usage: $0")
.help("help")
.strict()
.option("i", {
    alias: "id",
    describe: "Flow id",
    type: "string",
    default: "Flow2"
})
.option("t", {
    alias: "template",
    describe: "Flow template",
    type: "string",
    required: true
})
.option("c", {
    alias: "cleanup",
    describe: "Cleanup old flow before recreating new",
    type: "boolean",
    required: false
})
.option("r", {
    alias: "remove",
    describe: "Remove the flow created by template",
    type: "boolean",
    required: false
})
.argv;

console.log("Trying to load file:", argv.template);
const flowTemplate = require(argv.template);

const run = async () => {
    const restActionType = async (action, url, type, data) => {
        console.log(`Performing action for ${type} (${action} to ${url})`);

        const result = await rp[action]({
            url: url,
            body: data,
            json: true
        });

        if (action === "get") {
            if (!Array.isArray(result)) {
                console.error("Failed!");
                console.dir(result, { colors: true, depth: null });
                
                return null;
            }

            return result;
        }
        
        if (result.result !== "success") {
            console.error("Failed!");
            console.dir(result, { colors: true, depth: null });

            return null;
        }

        return result.data;
    };

    const objToQuery = (obj) => Object.keys(obj).reduce((acc, key) => acc.concat(`${key}=${JSON.stringify(obj[key])}`), "");
    const restQueryType = (uri, type, data) => restActionType("get", `${uri}/${type}?${objToQuery(data)}`, type, data);
    const restCreateType = (uri, type, data) => restActionType("post", `${uri}/${type}`, type, data);
    const restDeleteType = (uri, type, id) => restActionType("delete", `${uri}/${type}/${id}`, type);

    const flowCtrlDo = async (func, type, data) => await func(`http://localhost:${configFlowCtrl.web.port}`, type, data);
    const flowCtrlQuery = async (type, data) => await flowCtrlDo(restQueryType, type, data);
    const flowCtrlCreate = async (type, data) => await flowCtrlDo(restCreateType, type, data);
    const flowCtrlDelete = async (type, data) => await flowCtrlDo(restDeleteType, type, data);
    
    const baselineGenDo = async (func, type, data) => await func(`http://localhost:${configBaselineGen.web.port}`, type, data);
    const baselineGenQuery = async (type, data) => await baselineGenDo(restQueryType, type, data);
    const baselineGenCreate = async (type, data) => await baselineGenDo(restCreateType, type, data);
    const baselineGenDelete = async (type, data) => await baselineGenDo(restDeleteType, type, data);

    const { flow, specifications, steps } = await flowTemplate(argv);

    if (argv.cleanup || argv.remove) {
        for (const blSpec of specifications) {
            try {
                await baselineGenDelete("specification", blSpec._id);
            } catch (error) {}
        }

        const dbSteps = await flowCtrlQuery("step", { "flow.id": flow._id });
        console.log("dbSteps", dbSteps);
        for (const step of dbSteps) {
            try {
                console.log("Delete", "step", step._id);
                //await flowCtrlDelete("step", step._id);
            } catch (error) {}
        }

        try {
            await flowCtrlDelete("flow", flow._id);
        } catch (error) {}
    }

    if (argv.remove) {
        return 0;
    }
    

    // Create baselinegen stuff
    for (const blSpec of specifications) {
        await baselineGenCreate("specification", blSpec);
    }

    // Create flowctrl stuff
    await flowCtrlCreate("flow", flow);

    const stepIds = {};
    for (const step of steps) {
        step.parentSteps = step.parentStepNames.map((stepName) => stepIds[stepName]);
        const data = await flowCtrlCreate("step", step);
        stepIds[step.name] = data._id;
    }

    console.log("done");
};

run()
.catch((error) => {
    console.error(error);
    process.exit(255);
});
