import React, { useEffect, useState, SyntheticEvent } from 'react';
import {
    CoinBalance,
    CoinStruct,
    PaginatedCoins,
    TransactionBlock
} from '@mysten/sui.js';
import { useWalletKit } from '@mysten/wallet-kit';
import { useOutletContext } from 'react-router-dom';

import { Bet, getErrorName, getConfig } from './lib/gotbeef';
import { showConfetti } from './lib/confetti';
export function Fund(props: any)
{
    const [network] = useOutletContext<string>();
    const {packageId, rpc} = getConfig(network);
    const [payCoins, setPayCoins] = useState<CoinStruct[]>([]);
    const [answer, setAnswer] = useState('');
    const [error, setError] = useState('');

    // Look for a Coin<T> with enough balance to fund the bet
    const { currentAccount } = useWalletKit();

    useEffect(() => {
        fetchUserCoins()
        .catch(error => {
            console.warn('[fetchUserCoins]', error.stack);
            setError('[fetchUserCoins] ' + error.message);
        });
    }, [currentAccount]);

    const fetchUserCoins = async () =>
    {
        setPayCoins([]);
        setError('');

        if (!currentAccount) {
            throw new Error('Wallet not connected');
        }

        // Check if the user has enough balance to fund for the bet
        const coinBalance: CoinBalance = await rpc.getBalance({
            owner: currentAccount.address,
            coinType: props.bet.collatType,
        });
        if (props.bet.size > coinBalance.totalBalance) {
            throw new Error("Your wallet doesn't have enough balance to fund the bet");
        }

        // Get the coin objects
        const paginatedCoins: PaginatedCoins = await rpc.getCoins({
            owner: currentAccount.address,
            coinType: props.bet.collatType,
        });
        // if (paginatedCoins.hasNextPage) // TODO
        setPayCoins(paginatedCoins.data);
    };

    const { signAndExecuteTransactionBlock } = useWalletKit();
    const fundBet = (bet: Bet, answer: string, payCoins: CoinStruct[]): Promise<any> => // TODO add type
    {
        if (!currentAccount) {
            throw new Error('Wallet not connected');
        }
        console.debug(`[fundBet] Calling bet::fund on package: ${packageId}`);

        const tx = new TransactionBlock();

        let fundingCoin: ReturnType<TransactionBlock['splitCoins']>;
        if (bet.collatType === '0x2::sui::SUI') {
            fundingCoin = tx.splitCoins(tx.gas, [tx.pure(bet.size)]);
        }
        else {
            const [firstCoin, ...otherCoins] = payCoins; // MAYBE: do rpc.getCoins() here
            const firstCoinInput = tx.object(firstCoin.coinObjectId);
            if (otherCoins.length) {
                tx.mergeCoins(
                    firstCoinInput,
                    otherCoins.map((coin) => tx.object(coin.coinObjectId))
                );
            }
            fundingCoin = tx.splitCoins(firstCoinInput, [tx.pure(bet.size)]);
        }

        tx.moveCall({
            target: `${packageId}::bet::fund`,
            typeArguments: [ bet.collatType ],
            arguments: [
                tx.object(bet.id),
                tx.pure(answer),
                fundingCoin,
            ],
        });

        return signAndExecuteTransactionBlock({
            transactionBlock: tx,
            options: {
                showEffects: true,
            },
        });
    };

    const onClickFund = (e: SyntheticEvent) =>
    {
        e.preventDefault();
        fundBet(props.bet, answer, payCoins)
        .then(resp => {
            // @ts-ignore
            const effects = resp.effects.effects || resp.effects; // Suiet || Sui|Ethos
            if (effects.status.status == 'success') {
                showConfetti('💸');
                setError('');
                setTimeout(props.reloadBet, 1000);
                props.setModal('');
                console.debug('[onClickFund] Success:', resp);
            } else {
                setError( getErrorName(effects.status.error) );
            }
        })
        .catch(error => {
            setError( getErrorName(error.message) );
            console.warn(error);
        });
    };

    const onClickBack = () => {
        props.setModal('');
    };

    return <section className='bet-modal'>
        <h2>Fund bet</h2>
        <div>
            Bet size is {props.bet.size/1_000_000_000} <i className='nes-icon coin is-small' /> {props.bet.collatType}
            <br/>
            <form onSubmit={onClickFund} className='nes-field'>
                <label htmlFor='answer_field'>Answer (optional)</label>
                <input type='text' id='answer_field' className={`nes-input ${payCoins.length ? '' : 'is-disabled'}`} maxLength={500}
                    spellCheck='false' autoCorrect='off' autoComplete='off'
                    value={answer} disabled={!payCoins.length} onChange={e => setAnswer(e.target.value)}
                />
            </form>
            <br/>
            <button type='button' className={`nes-btn ${payCoins.length ? 'is-success' : 'is-disabled'}`}
                    disabled={!payCoins.length} onClick={onClickFund}>
                FUND
            </button>
            &nbsp;
            <button type='button' className='nes-btn' onClick={onClickBack}>
                BACK
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
