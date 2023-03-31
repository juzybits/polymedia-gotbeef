import React, { useState, SyntheticEvent } from 'react';
import { TransactionBlock } from '@mysten/sui.js';
import { useWalletKit } from '@mysten/wallet-kit';
import { useOutletContext } from 'react-router-dom';

import { Bet, getErrorName, getConfig } from './lib/gotbeef';
import { showConfetti } from './lib/confetti';

export function Vote(props: any) {

    const [network] = useOutletContext<string>();
    const {packageId} = getConfig(network);
    const [error, setError] = useState('');

    const { signAndExecuteTransactionBlock } = useWalletKit();
    const castVote = (bet: Bet, player_addr: string): Promise<any> => // TODO add type
    {
        console.debug(`[castVote] Calling bet::vote on package: ${packageId}`);

        const tx = new TransactionBlock();
        tx.moveCall({
            target: `${packageId}::bet::vote`,
            typeArguments: [ bet.collatType ],
            arguments: [
                tx.object(bet.id),
                tx.pure(player_addr),
            ],
        });

        return signAndExecuteTransactionBlock({
            transactionBlock: tx,
            options: {
                showEffects: true,
            },
        });
    };

    const onClickVote = (e: SyntheticEvent) => {
        const player_addr = (e.target as HTMLButtonElement).value;
        castVote(props.bet, player_addr)
        .then(resp => {
            // @ts-ignore
            const effects = resp.effects.effects || resp.effects; // Suiet || Sui|Ethos
            if (effects.status.status == 'success') {
                showConfetti();
                setError('');
                setTimeout(props.reloadBet, 1000);
                props.setModal('');
                console.debug('[onClickVote] Success:', resp);
            } else {
                setError( getErrorName(effects.status.error) );
            }
        })
        .catch(error => {
            setError( getErrorName(error.message) );
        });
    };

    const onClickBack = () => {
        props.setModal('');
    };

    const profileNameOrBlank = (address: string): string => {
        const profile = props.profiles.get(address);
        return profile ? profile.name : '';
    };

    return <section className='bet-modal'>
        <h2>Vote</h2>
        Click the address of the winner:
        <br/>
        {
            props.bet.players.map((player: string) =>
                <div key={player} className='player-box'>
                    <div>{profileNameOrBlank(player)}</div>
                    <button type='button' className='nes-btn is-primary' style={{overflowWrap: 'anywhere'}}
                        value={player} onClick={onClickVote}>{player}
                    </button>
                    <span className='player-box-answer'>
                        <b>ANSWER:</b> {props.bet.answers.get(player) || '-'}
                    </span>
                </div>
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
