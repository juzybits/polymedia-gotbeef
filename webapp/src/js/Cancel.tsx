import React from 'react';

export function Cancel(props) {
    return <React.Fragment>
        <h2>Cancel bet</h2>
        <div>
            Canceling: {props.betObjId}
        </div>
        <br/>
    </React.Fragment>;
}
