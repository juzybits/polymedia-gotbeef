import React from 'react';

export function Fund(props) {
    return <React.Fragment>
        <h2>Fund bet</h2>
        <div>
            Funding: {props.betObj.details.data.fields.id.id}
            <br/>
            Bet size: {props.betObj.details.data.fields.bet_size}
        </div>
        <br/>
    </React.Fragment>;
}
