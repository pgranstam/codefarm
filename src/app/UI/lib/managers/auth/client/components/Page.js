import React from "react";
import LightComponent from "ui-lib/light_component";
import SignInForm from "./SignInForm";
import SignOutForm from "./SignOutForm";
import ActiveUser from "ui-observables/active_user";

class Page extends LightComponent {
    constructor(props) {
        super(props);

        this.state = {
            activeUser: ActiveUser.instance.user.getValue()
        };
    }

    componentDidMount() {
        this.addDisposable(ActiveUser.instance.user.subscribe((activeUser) => this.setState({ activeUser })));
    }

    render() {
        this.log("render", this.props);

        const userLoggedIn = this.state.activeUser.get("userLoggedIn");

        return (
            <div className={this.props.theme.content}>
                <Choose>
                    <When condition={ userLoggedIn }>
                        <SignOutForm
                            theme={this.props.theme}
                            userId={this.state.activeUser.get("_id")}
                            userName={this.state.activeUser.get("username")}
                        />
                    </When>
                    <Otherwise>
                        <SignInForm theme={this.props.theme} />
                    </Otherwise>
                </Choose>
            </div>
        );
    }
}

Page.propTypes = {
    theme: React.PropTypes.object
};

export default Page;
