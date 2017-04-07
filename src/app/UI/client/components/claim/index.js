
import { names, exporter } from "ui-lib/exporter";
import theme from "./theme.scss";

const name = names.CLAIM;
const exports = [
    require("./Claim")
];

module.exports = exporter(name, theme, exports);
