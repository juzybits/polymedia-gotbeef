import React, { useEffect, useState, SyntheticEvent } from 'react';
import {
    CoinBalance,
    PaginatedCoins,
    TransactionEffects,
} from '@mysten/sui.js/client';
import {
    TransactionBlock,
} from '@mysten/sui.js/transactions';
import { useWalletKit } from '@mysten/wallet-kit';
import { useOutletContext } from 'react-router-dom';

import { AppContext } from './App';
import { Bet, getErrorName, getConfig } from './lib/gotbeef';
import { showConfetti } from './lib/confetti';

export const Fund: React.FC<{
    bet: Bet,
    reloadBet: () => Promise<void>,
    setModal: React.Dispatch<React.SetStateAction<React.ReactNode|null>>,
}> = ({
    bet,
    reloadBet,
    setModal,
}) => {
    const {network, suiClient} = useOutletContext<AppContext>();
    const {packageId} = getConfig(network);
    const [userHasFunds, setUserHasFunds] = useState(false);
    const [answer, setAnswer] = useState('');
    const [error, setError] = useState('');

    // Look for a Coin<T> with enough balance to fund the bet
    const { currentAccount } = useWalletKit();

    useEffect(() => {
        checkUserFunds()
        .catch(error => {
            console.warn('[checkUserFunds]', error.stack);
            setError('[checkUserFunds] ' + error.message);
        });
    }, [currentAccount]);

    const checkUserFunds = async () =>
    {
        setUserHasFunds(false);
        setError('');

        if (!currentAccount) {
            throw new Error('Wallet not connected');
        }

        const coinBalance: CoinBalance = await suiClient.getBalance({
            owner: currentAccount.address,
            coinType: bet.collatType,
        });

        if (bet.size > BigInt(coinBalance.totalBalance)) {
            throw new Error("Your wallet doesn't have enough balance to fund the bet");
        } else {
            setUserHasFunds(true);
        }
    };

    const { signTransactionBlock } = useWalletKit();
    const fundBet = async (
        bet: Bet,
        answer: string,
    ): ReturnType<typeof suiClient['executeTransactionBlock']> =>
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
            // Get the coin objects
            const paginatedCoins: PaginatedCoins = await suiClient.getCoins({
                owner: currentAccount.address,
                coinType: bet.collatType,
            });
            // if (paginatedCoins.hasNextPage) // MAYBE (unlikely it's needed in practice)

            // Merge all coins into one
            const [firstCoin, ...otherCoins] = paginatedCoins.data;
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
                tx.pure(Array.from( (new TextEncoder()).encode(answer) )),
                fundingCoin,
            ],
        });

        const signedTx = await signTransactionBlock({
            transactionBlock: tx,
        });
        return suiClient.executeTransactionBlock({
            transactionBlock: signedTx.transactionBlockBytes,
            signature: signedTx.signature,
            options: {
                showEffects: true,
            },
        });
    };

    const onClickFund = (e: SyntheticEvent) =>
    {
        e.preventDefault();
        fundBet(bet, answer)
        .then(resp => {
            const effects = resp.effects as TransactionEffects;
            if (effects.status.status == 'success') {
                showConfetti('💸');
                setError('');
                setModal('');
                reloadBet();
                console.debug('[onClickFund] Success:', resp);
            } else {
                setError( getErrorName(effects.status.error) );
            }
        })
        .catch(error => {
            setError( getErrorName(error.message) );
            console.warn('[onClickFund]', error.stack);
        });
    };

    const onClickBack = () => {
        setModal('');
    };

    return <section className='bet-modal'>
        <h2>Fund bet</h2>
        <div>
            Bet size is {bet.size/1_000_000_000} <i className='nes-icon coin is-small' /> {bet.collatType}
            <br/>
            <form onSubmit={onClickFund} className='nes-field'>
                <label htmlFor='answer_field'>Answer (optional)</label>
                <input type='text' id='answer_field' className={`nes-input ${userHasFunds ? '' : 'is-disabled'}`} maxLength={500}
                    spellCheck='false' autoCorrect='off' autoComplete='off'
                    value={answer} disabled={!userHasFunds} onChange={e => setAnswer(e.target.value)}
                />
            </form>
            <br/>
            <button type='button' className={`nes-btn ${userHasFunds ? 'is-success' : 'is-disabled'}`}
                    disabled={!userHasFunds} onClick={onClickFund}>
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
