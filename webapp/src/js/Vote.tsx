import React from 'react';

import { vote } from './lib/sui_tools';

export function Vote(props) {

    const onClickVote = (e) => {
        const player_addr = e.target.value;
        vote(props.bet, player_addr)
        .then(resp => {
            if (resp.effects.status.status == 'success') {
                // setError(undefined);
                console.log("Success:", resp); // TODO Remove
                // TODO setBet
            } else {
                console.log("Error1:", resp); // TODO Remove
                // setError( getErrorName(resp.effects.status.error) );
            }
        })
        .catch(error => {
            console.log("Error2:", error); // TODO Remove
            // setError(error.message);
        });
    };

    return <React.Fragment>
        <h2>Vote</h2>
        <div>
            Click the address of the winner.
            <br/>
            {
                props.bet.players.map(player => {
                    return <button type='button' className='nes-btn is-primary'
                        key={player} value={player} onClick={onClickVote}>{player}
                    </button>;
                })
            }
            <br/>
        </div>
        <hr/>
        <br/>
    </React.Fragment>;
}
