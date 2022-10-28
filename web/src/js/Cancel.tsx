import React, { useState } from 'react';
import { SuiTransactionResponse } from '@mysten/sui.js';
import { useWallet } from "@mysten/wallet-adapter-react";

import { GOTBEEF_PACKAGE, Bet, getErrorName } from './lib/sui_tools';
import { showConfetti } from './lib/confetti';

export function Cancel(props: any) {

    const [error, setError] = useState('');

    const { signAndExecuteTransaction } = useWallet();
    const cancelBet = (bet: Bet): Promise<SuiTransactionResponse> => {
        console.debug(`[cancelBet] Calling bet::cancel on package: ${GOTBEEF_PACKAGE}`);
        return signAndExecuteTransaction({
            kind: 'moveCall',
            data: {
                packageObjectId: GOTBEEF_PACKAGE,
                module: 'bet',
                function: 'cancel',
                typeArguments: [ bet.collatType ],
                arguments: [
                    bet.id,
                ],
                gasBudget: 10000,
            }
        });
    };

    const onClickCancel = () => {
        cancelBet(props.bet)
        .then(resp => {
            if (resp.effects.status.status == 'success') {
                showConfetti('🧨');
                setError('');
                props.reloadBet();
                props.setModal('');
                console.debug('[onClickCancel] Success:', resp);
            } else {
                setError( getErrorName(resp.effects.status.error) );
            }
        })
        .catch(error => {
            setError( getErrorName(error.message) );
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
            CANCEL
        </button>
        &nbsp;
        <button type='button' className='nes-btn' onClick={onClickBack}>
            BACK
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
