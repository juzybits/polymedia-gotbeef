import React from 'react';

export function Cancel(props) {
    return <React.Fragment>
        <h2>Cancel bet</h2>
        <div>
            Canceling: {props.betObj.details.data.fields.id.id}
        </div>
        <br/>
    </React.Fragment>;
}
