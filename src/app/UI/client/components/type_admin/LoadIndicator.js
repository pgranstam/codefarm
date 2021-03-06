
import React from "react";
import PropTypes from "prop-types";
import ProgressBar from "react-toolbox/lib/progress_bar";

class LoadIndicator extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div className={this.props.theme.loading}>
                <ProgressBar
                    type="circular"
                    mode="indeterminate"
                    multicolor
                    className={this.props.theme.loadingProgressBar}
                />
            </div>
        );
    }
}

LoadIndicator.propTypes = {
    theme: PropTypes.object
};

export default LoadIndicator;
