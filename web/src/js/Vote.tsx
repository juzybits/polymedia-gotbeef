import React, { useState, SyntheticEvent } from 'react';
import { SuiTransactionResponse } from '@mysten/sui.js';
import { useWallet } from "@mysten/wallet-adapter-react";
import { useOutletContext } from 'react-router-dom';

import { Bet, getErrorName, getPackageAndRpc } from './lib/beef';
import { showConfetti } from './lib/confetti';

export function Vote(props: any) {

    const [network] = useOutletContext<string>();
    const [packageId, _rpc] = getPackageAndRpc(network);
    const [error, setError] = useState('');

    const { signAndExecuteTransaction } = useWallet();
    const castVote = (bet: Bet, player_addr: string): Promise<SuiTransactionResponse> =>
    {
        console.debug(`[castVote] Calling bet::vote on package: ${packageId}`);
        // @ts-ignore
        return signAndExecuteTransaction({
            kind: 'moveCall',
            data: {
                packageObjectId: packageId,
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
