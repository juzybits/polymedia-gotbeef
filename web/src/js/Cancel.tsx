import React, { useState } from 'react';

import { cancelBet, getErrorName } from './lib/sui_tools';
import { showConfetti } from './lib/confetti';

export function Cancel(props) {

    const [error, setError] = useState(undefined);

    const onClickCancel = () => {
        cancelBet(props.bet)
        .then(resp => {
            if (resp.effects.status.status == 'success') {
                showConfetti('🧨');
                setError(undefined);
                props.reloadBet();
                props.setModal('');
                console.debug('[onClickCancel] Success:', resp);
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
        <h2>Cancel bet</h2>
        The bet can be canceled because nobody has funded it yet.
        <br/>
        <br/>
        <button type='button' className='nes-btn is-error' onClick={onClickCancel}>
            Cancel
        </button>
        &nbsp;
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
