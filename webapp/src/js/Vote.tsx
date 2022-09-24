import React from 'react';

export function Vote(props) {
    return <React.Fragment>
        <h2>Vote winner</h2>
        <div>
            Voting: {props.betObj.details.data.fields.id.id}
            <br/>
            Players: {props.betObj.details.data.fields.players}
        </div>
        <br/>
    </React.Fragment>;
}
