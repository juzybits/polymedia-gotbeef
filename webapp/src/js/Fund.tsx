import React from 'react';

export function Fund(props) {
    return <React.Fragment>
        <h2>Fund bet</h2>
        <div>
            Funding: {props.betObjId}
            <br/>
            Bet size: {props.data.bet_size}
        </div>
        <br/>
    </React.Fragment>;
}
