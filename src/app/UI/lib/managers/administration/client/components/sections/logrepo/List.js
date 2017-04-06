
import React from "react";
import LightComponent from "ui-lib/light_component";
import { ListCards } from "ui-components/type_admin";
import LogRepositoryListObservable from "ui-observables/paged_logrepository_list";

class LogRepositoryList extends LightComponent {
    constructor(props) {
        super(props);

        this.list = new LogRepositoryListObservable({
            sortOn: "_id",
            limit: 20
        });

        this.state = {
            list: this.list.value.getValue(),
            state: this.list.state.getValue()
        };
    }

    componentDidMount() {
        this.log("componentDidMount");
        this.addDisposable(this.list.start());
        this.addDisposable(this.list.value.subscribe((list) => this.setState({ list })));
        this.addDisposable(this.list.state.subscribe((state) => this.setState({ state })));
    }

    render() {
        return (
            <ListCards
                items={this.state.list}
                listObservable={this.list}
                linkToAdmin={true}
                {...this.props}
            />
        );
    }
}

LogRepositoryList.propTypes = {
    theme: React.PropTypes.object,
    pathname: React.PropTypes.string.isRequired,
    breadcrumbs: React.PropTypes.array.isRequired,
    controls: React.PropTypes.array.isRequired
};

export default LogRepositoryList;
