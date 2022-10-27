import React, { useState, SyntheticEvent } from 'react';
import { useWallet } from "@mysten/wallet-adapter-react";

import { GOTBEEF_PACKAGE, getErrorName } from './lib/sui_tools';
import { showConfetti } from './lib/confetti';

export function Vote(props: any) {

    const [error, setError] = useState('');

    const { signAndExecuteTransaction } = useWallet();
    const castVote = (bet: Bet, player_addr: string): Promise<SuiTransactionResponse> =>
    {
        console.debug(`[castVote] Calling bet::vote on package: ${GOTBEEF_PACKAGE}`);
        return signAndExecuteTransaction({
            kind: 'moveCall',
            data: {
                packageObjectId: GOTBEEF_PACKAGE,
                module: 'bet',
                function: 'vote',
                typeArguments: [ bet.collatType ],
                arguments: [
                    bet.id,
                    player_addr,
                ],
                gasBudget: 10000,
            }
        });
    };

    const onClickVote = (e: SyntheticEvent) => {
        const player_addr = (e.target as HTMLButtonElement).value;
        castVote(props.bet, player_addr)
        .then(resp => {
            if (resp.effects.status.status == 'success') {
                showConfetti();
                setError('');
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
            props.bet.players.map((player: string) =>
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
