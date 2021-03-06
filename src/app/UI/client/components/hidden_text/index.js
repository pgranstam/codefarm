
import { names, exporter } from "ui-lib/exporter";
import theme from "./theme.scss";

const name = names.HIDDEN_TEXT;
const exports = {
    HiddenText: require("./HiddenText")
};

module.exports = exporter(name, theme, exports);
