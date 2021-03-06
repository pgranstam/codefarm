
import React from "react";
import PropTypes from "prop-types";
import { SvgGridExample } from "ui-components/svg_grid";
import { AppHeader } from "ui-components/app_header";
import LightComponent from "ui-lib/light_component";

class Page extends LightComponent {
    render() {
        return (
            <div>
                <AppHeader
                    theme={this.props.theme}
                    primaryText="Playground"
                    secondaryText="The place where anything can happen"
                    icon="child_friendly"
                />
                <SvgGridExample
                    theme={this.props.theme}
                />
            </div>
        );
    }
}

Page.propTypes = {
    theme: PropTypes.object
};

export default Page;
