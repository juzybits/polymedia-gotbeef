import React, { useEffect, useState } from 'react';

import { fundBet, getCoinObjects, getErrorName } from './lib/sui_tools';
import { showConfetti } from './lib/confetti';

export function Fund(props: any) {

    const [payCoin, setPayCoin]: any[] = useState(undefined);
    const [error, setError] = useState('');

    // Look for a Coin<T> with enough balance to fund the bet
    useEffect(() => {
        getCoinObjects(props.bet.collatType)
        .then(coins => {
            const coin = coins.find(obj => obj.details.data.fields.balance >= props.bet.size);
            console.debug('[Fund.useEffect] Found payment coin:', coin ? coin.details.data.fields : 'NONE');
            setPayCoin(coin||null);
            if (!coin) {
                setError(`Your wallet doesn't contain a Coin<${props.bet.collatType}> with a balance large enough to fund this bet.`);
            }
        })
        .catch(error => setError(error.message) );
    }, []);

    const onClickFund = () => {
        fundBet(props.bet, payCoin?.details.reference.objectId)
        .then(resp => {
            if (resp.effects.status.status == 'success') {
                showConfetti('💸');
                setError('');
                props.reloadBet();
                props.setModal('');
                console.debug('[onClickFund] Success:', resp);
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
        <h2>Fund bet</h2>
        <div>
            Bet size is {props.bet.size} <i className='nes-icon coin is-small' /> {props.bet.collatType}
            <br/>
            <br/>
            <button type='button' className={`nes-btn ${payCoin ? 'is-success' : 'is-disabled'}`} disabled={!payCoin} onClick={onClickFund}>
                Fund
            </button>
            &nbsp;
            <button type='button' className='nes-btn' onClick={onClickBack}>
                Back
            </button>
        </div>

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
