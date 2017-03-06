
import React from "react";
import LightComponent from "ui-lib/light_component";
import { CardTitle } from "react-toolbox/lib/card";
import HiddenText from "ui-components/hidden_text";
import DateTime from "ui-components/datetime";
import Tags from "ui-components/tags";
import ExpandableCard from "ui-components/expandable_card";
import stateVar from "ui-lib/state_var";

class ArtifactCard extends LightComponent {
    constructor(props) {
        super(props);

        this.state = {
            expanded: stateVar(this, "expanded", this.props.expanded)
        };
    }

    render() {
        const icon = () => {
            if (this.props.item.state === "commited") {
                return "/Cheser/48x48/mimetypes/package-x-generic.png";
            }

            return "/Cheser/48x48/mimetypes/application-x-rpm.png";
        };

        return (
            <ExpandableCard
                className={this.props.theme.card}
                expanded={this.state.expanded}
                expandable={this.props.expandable}
            >
                <CardTitle
                    avatar={(
                        <img
                            className={this.props.theme.avatar}
                            src={icon()}
                        />
                    )}
                    title={`${this.props.item.name} - ${this.props.item.version}`}
                    subtitle={(
                        <DateTime
                            value={this.props.item.created}
                            niceDate={true}
                        />
                    )}
                />
                {this.state.expanded.value && (
                    <table className={this.props.theme.table}>
                        <tbody>
                            <tr>
                                <td>State</td>
                                <td>{this.props.item.state}</td>
                            </tr>
                            <tr>
                                <td>Filename</td>
                                <td>
                                    <span className={this.props.theme.monospace}>
                                        {this.props.item.fileMeta.filename}
                                    </span>
                                    <HiddenText
                                        className={this.props.theme.hiddenText}
                                        label="SHOW ID"
                                        text={this.props.item._id}
                                    />
                                </td>
                            </tr>
                            <tr>
                                <td>Repository</td>
                                <td>{this.props.item.repository}</td>
                            </tr>
                            <tr>
                                <td>Size</td>
                                <td>{this.props.item.fileMeta.size}</td>
                            </tr>
                            <tr>
                                <td>Mimetype</td>
                                <td>{this.props.item.fileMeta.mimeType}</td>
                            </tr>
                            {Object.keys(this.props.item.fileMeta.hashes).map((key) => (
                                <tr key={key}>
                                    <td>{key}</td>
                                    <td className={this.props.theme.monospace}>
                                        {this.props.item.fileMeta.hashes[key]}
                                    </td>
                                </tr>
                            ))}
                            <tr>
                                <td>Tags</td>
                                <td>
                                    <Tags list={this.props.item.tags} />
                                </td>
                            </tr>
                        </tbody>
                    </table>
                )}
            </ExpandableCard>
        );
    }
}

ArtifactCard.defaultProps = {
    expanded: false,
    expandable: true
};

ArtifactCard.propTypes = {
    theme: React.PropTypes.object,
    item: React.PropTypes.object.isRequired,
    expanded: React.PropTypes.bool,
    expandable: React.PropTypes.bool
};

export default ArtifactCard;