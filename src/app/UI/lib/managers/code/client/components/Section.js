
import React from "react";
import moment from "moment";
import LightComponent from "ui-lib/light_component";
import OverviewSection from "./sections/Overview";
import JobSection from "./sections/Job";
import StepSection from "./sections/Step";

class Section extends LightComponent {
    findJob() {
        const jobRefs = this.props.itemExt.data.refs
            .filter((ref) => ref.name === this.props.step && ref.type === "exec.job");

        if (jobRefs.length > 0) {
            jobRefs.sort((a, b) => moment(a.data.created).isBefore(b.data.created) ? 1 : -1);

            return jobRefs[0] ? jobRefs[0].data : false;
        }

        return false;
    }

    render() {
        this.log("render", this.props, this.state);

        if (!this.props.step) {
            return (
                <OverviewSection
                    theme={this.props.theme}
                    item={this.props.item}
                    itemExt={this.props.itemExt}
                    label={this.props.label}
                />
            );
        }

        const job = this.findJob();

        if (job) {
            return (
                <JobSection
                    theme={this.props.theme}
                    item={this.props.item}
                    jobItem={job}
                />
            );
        }

        return (
            <StepSection
                theme={this.props.theme}
                item={this.props.item}
                step={this.props.step}
            />
        );
    }
}

Section.propTypes = {
    theme: React.PropTypes.object,
    item: React.PropTypes.object.isRequired,
    itemExt: React.PropTypes.object.isRequired,
    step: React.PropTypes.string,
    label: React.PropTypes.string.isRequired
};

export default Section;
