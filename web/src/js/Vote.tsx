import React, { useState } from 'react';

import { castVote, getErrorName } from './lib/sui_tools';
import { showConfetti } from './lib/confetti';

export function Vote(props) {

    const [error, setError] = useState(undefined);

    const onClickVote = (e) => {
        const player_addr = e.target.value;
        castVote(props.bet, player_addr)
        .then(resp => {
            if (resp.effects.status.status == 'success') {
                showConfetti();
                setError(undefined);
                props.reloadBet();
                props.setModal('');
                console.debug('[onClickVote] Success:', resp);
            } else {
                setError( getErrorName(resp.effects.status.error) );
            }
        })
        .catch(error => {
            setError(error.message);
        });
    };

    const onClickBack = () => {
        props.setModal('');
    };

    return <section className='bet-modal'>
        <h2>Vote</h2>
        Click the address of the winner.
        <br/>
        {
            props.bet.players.map(player =>
                <React.Fragment key={player}>
                    <br/>
                    <button type='button' className='nes-btn is-primary'
                        value={player} onClick={onClickVote}>{player}
                    </button>
                    <br/>
                </React.Fragment>
            )
        }
        <br/>
        <button type='button' className='nes-btn' onClick={onClickBack}>
            Back
        </button>
        <br/>

        {error &&
        <React.Fragment>
            <br/>
            ERROR:
            <br/>
            {error}
            <br/>
        </React.Fragment>}
        <br/>
        <hr/>
    </section>;
}