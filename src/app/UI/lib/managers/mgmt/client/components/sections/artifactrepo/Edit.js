
import React from "react";
import PropTypes from "prop-types";
import LightComponent from "ui-lib/light_component";
import Input from "react-toolbox/lib/input";
import Dropdown from "react-toolbox/lib/dropdown";
import Autocomplete from "react-toolbox/lib/autocomplete";
import {
    Form as TAForm,
    Section as TASection,
    utils as tautils
} from "ui-components/type_admin";

const BACKEND_TYPE = {
    FS: "fs",
    ARTIFACTORY: "artifactory"
};

const DEFAULT_POLL_INTERVAL_IN_MINUTES = 5;

class Edit extends LightComponent {
    constructor(props) {
        super(props);

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
                defaultValue: BACKEND_TYPE.FS
            },
            "path": {
                editable: true,
                required: () => this.state.backendType.value === BACKEND_TYPE.FS,
                defaultValue: ""
            },
            "uri": {
                editable: true,
                required: () => this.state.backendType.value === BACKEND_TYPE.ARTIFACTORY,
                defaultValue: ""
            },
            "pollInterval": {
                editable: true,
                required: () => this.state.backendType.value === BACKEND_TYPE.ARTIFACTORY,
                defaultValue: DEFAULT_POLL_INTERVAL_IN_MINUTES
            }
        };

        this.state = tautils.createStateProperties(this, this.itemProperties, this.props.item);
    }

    getBackendTypes() {
        return [
            { value: BACKEND_TYPE.FS, label: "Filesystem" },
            { value: BACKEND_TYPE.ARTIFACTORY, label: "Artifactory" }
        ];
    }

    async onConfirm() {
        const data = tautils.serialize(this.state, this.itemProperties, this.props.item);
        await this.props.onSave("artifactrepo.backend", data, {
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
                    primaryText={`${this.props.item ? "Edit" : "Create"} artifact repository backend`}
                    secondaryText="An artifact repository backend contains information about..."
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
                        <When condition={this.state.backendType.value === BACKEND_TYPE.FS}>
                            <Input
                                type="text"
                                label="Path to store repositories"
                                name="path"
                                floating={true}
                                required={this.itemProperties.path.required()}
                                disabled={this.props.item && !this.itemProperties.path.editable}
                                value={this.state.path.value}
                                onChange={this.state.path.set}
                            />
                        </When>
                        <When condition={this.state.backendType.value === BACKEND_TYPE.ARTIFACTORY}>
                            <Input
                                type="url"
                                label="URI to use when connecting to artifactory"
                                name="uri"
                                floating={true}
                                required={this.itemProperties.uri.required()}
                                disabled={this.props.item && !this.itemProperties.uri.editable}
                                value={this.state.uri.value}
                                onChange={this.state.uri.set}
                            />
                            <Input
                                type="number"
                                label="Interval in minutes to poll for updates"
                                name="pollInterval"
                                floating={true}
                                required={this.itemProperties.pollInterval.required()}
                                disabled={this.props.item && !this.itemProperties.pollInterval.editable}
                                value={this.state.pollInterval.value}
                                onChange={this.state.pollInterval.set}
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
