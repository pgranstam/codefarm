
import React from "react";
import PropTypes from "prop-types";
import LightComponent from "ui-lib/light_component";
import { UserAvatar } from "ui-components/user_avatar";
import { DateTime } from "ui-components/datetime";
import { Tags } from "ui-components/tags";
import DataCard from "./DataCard";
import { CardTitle } from "react-toolbox/lib/card";
import stateVar from "ui-lib/state_var";
import { TypeChip } from "ui-components/data_chip";
import * as pathBuilder from "ui-lib/path_builder";

class LogRepositoryCard extends LightComponent {
    constructor(props) {
        super(props);

        this.state = {
            expanded: stateVar(this, "expanded", this.props.expanded)
        };
    }

    render() {
        const myItemPath = pathBuilder.fromType(this.props.item.type, this.props.item, { prefix: this.props.linkToAdmin ? "admin" : false });

        return (
            <DataCard
                theme={this.props.theme}
                expanded={this.state.expanded}
                expandable={this.props.expandable}
                path={this.props.clickable ? myItemPath : ""}
            >
                <CardTitle
                    avatar={(
                        <UserAvatar
                            className={this.props.theme.avatar}
                            defaultUrl="/Cheser/48x48/apps/system-file-manager.png"
                        />
                    )}
                    title={this.props.item._id}
                    subtitle={(
                        <DateTime
                            value={this.props.item.created}
                            niceDate={true}
                        />
                    )}
                />
                <If condition={this.state.expanded.value}>
                    <table className={this.props.theme.table}>
                        <tbody>
                            <tr>
                                <td>Backend</td>
                                <td>
                                    <TypeChip
                                        itemRef={{
                                            _ref: true,
                                            type: "logrepo.backend",
                                            id: this.props.item.backend
                                        }}
                                    />
                                </td>
                            </tr>
                            <tr>
                                <td>Tags</td>
                                <td>
                                    <Tags list={this.props.item.tags} />
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </If>
            </DataCard>
        );
    }
}

LogRepositoryCard.defaultProps = {
    expanded: false,
    expandable: true,
    clickable: false
};

LogRepositoryCard.propTypes = {
    theme: PropTypes.object,
    item: PropTypes.object.isRequired,
    expanded: PropTypes.bool,
    expandable: PropTypes.bool,
    clickable: PropTypes.bool,
    linkToAdmin: PropTypes.bool
};

export default LogRepositoryCard;
