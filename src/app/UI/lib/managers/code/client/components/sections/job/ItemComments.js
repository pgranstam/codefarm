
import React from "react";
import LightComponent from "ui-lib/light_component";
import moment from "moment";
import api from "api.io/api.io-client";
import stateVar from "ui-lib/state_var";
import { CommentCard, AddCommentCard } from "ui-components/data_card";

class ItemComments extends LightComponent {
    constructor(props) {
        super(props);

        this.state = {
            comment: stateVar(this, "comment", "")
        };
    }

    async onComment(comment) {
        await api.type.action(this.props.item.type, this.props.item._id, "comment", comment);
    }

    render() {
        this.log("render", this.props, this.state);

        const list = [];

        for (const comment of this.props.item.comments) {
            list.push({
                id: comment.time,
                time: moment(comment.time).unix(),
                item: comment,
                Card: CommentCard,
                props: {}
            });
        }

        list.sort((a, b) => b.time - a.time);

        return (
            <div>
                <AddCommentCard
                    onComment={this.onComment.bind(this)}
                />
                {list.map((item) => (
                    <item.Card
                        key={item.id}
                        item={item.item}
                        {...item.props}
                        expanded={true}
                    />
                ))}
            </div>
        );
    }
}

ItemComments.propTypes = {
    theme: React.PropTypes.object,
    item: React.PropTypes.object.isRequired
};

export default ItemComments;
