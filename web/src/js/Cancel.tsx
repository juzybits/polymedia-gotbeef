import React, { useState } from 'react';
import { TransactionBlock, TransactionEffects } from '@mysten/sui.js';
import { useWalletKit } from '@mysten/wallet-kit';
import { useOutletContext } from 'react-router-dom';

import { AppContext } from './App';
import { Bet, getErrorName, getConfig } from './lib/gotbeef';
import { showConfetti } from './lib/confetti';

export const Cancel: React.FC<{
    bet: Bet,
    reloadBet: () => Promise<void>,
    setModal: React.Dispatch<React.SetStateAction<React.ReactNode|null>>,
}> = ({
    bet,
    reloadBet,
    setModal,
}) => {
    const {network} = useOutletContext<AppContext>();
    const [error, setError] = useState('');

    const { packageId } = getConfig(network);
    const { signAndExecuteTransactionBlock } = useWalletKit();
    const cancelBet = (bet: Bet): ReturnType<typeof signAndExecuteTransactionBlock> => {
        console.debug(`[cancelBet] Calling bet::cancel on package: ${packageId}`);

        const tx = new TransactionBlock();
        tx.moveCall({
            target: `${packageId}::bet::cancel`,
            typeArguments: [ bet.collatType ],
            arguments: [
                tx.object(bet.id),
            ],
        });

        return signAndExecuteTransactionBlock({
            transactionBlock: tx,
            options: {
                showEffects: true,
            },
        });
    };

    const onClickCancel = () => {
        cancelBet(bet)
        .then(resp => {
            const effects = resp.effects as TransactionEffects;
            if (effects.status.status == 'success') {
                showConfetti('🧨');
                setError('');
                setTimeout(reloadBet, 1000); // TODO edit current bet object
                setModal('');
                console.debug('[onClickCancel] Success:', resp);
            } else {
                setError( getErrorName(effects.status.error) );
            }
        })
        .catch(error => {
            setError( getErrorName(error.message) );
        });
    };

    const onClickBack = () => {
        setModal('');
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
