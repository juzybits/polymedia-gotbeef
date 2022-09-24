import React from 'react';

export function Vote(props) {
    return <React.Fragment>
        <h2>Vote winner</h2>
        <div>
            Voting: {props.betObjId}
            <br/>
            Players: {props.data.players}
        </div>
        <br/>
    </React.Fragment>;
}
