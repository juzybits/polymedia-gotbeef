/*
import React, { useEffect, useState, SyntheticEvent } from 'react';
import { CoinStruct, TransactionBlock } from '@mysten/sui.js';
import { useWalletKit } from '@mysten/wallet-kit';
import { useOutletContext } from 'react-router-dom';

import { Bet, getErrorName, getCoinObjects, getPackageAndRpc } from './lib/beef';
import { showConfetti } from './lib/confetti';
*/
export function Fund(_props: any)
{
    /*
    const [network] = useOutletContext<string>();
    const [packageId, _rpc] = getPackageAndRpc(network);
    const [payCoins, setPayCoins] = useState<CoinStruct[]>([]);
    const [answer, setAnswer] = useState('');
    const [error, setError] = useState('');
    const GAS_BUDGET = 10000;

    // Look for a Coin<T> with enough balance to fund the bet
    const { currentAccount } = useWalletKit();
    useEffect(() =>
    {
        if (!currentAccount)
            return;

        getCoinObjects(network, currentAccount.address, props.bet.collatType)
        .then((coins: CoinStruct[]) => {
            let smallestCoin = null; // to pay for gas
            let payCoins = []; // to fund the bet
            let payCoinsVal = 0; // sum of `payCoins` balances
            let betSize = Number(props.bet.size);

            for ( const coin of coins ) {
                if (smallestCoin === null) {
                    smallestCoin = coin;
                    continue;
                }
                let coinVal = coin.balance;
                let smallestVal = smallestCoin.balance;
                if (coinVal < smallestVal && coinVal >= GAS_BUDGET) {
                    payCoins.push(smallestCoin);
                    payCoinsVal += smallestVal;
                    smallestCoin = coin;
                    continue;
                }
                payCoins.push(coin);
                payCoinsVal += coinVal;
                if (payCoinsVal >= betSize) {
                    break;
                }
            }

            if (payCoinsVal >= betSize) {
                console.debug(`[Fund.useEffect] Found coins to fund bet. Aggregate balance = ${payCoinsVal}. Coins:`, payCoins);
                setPayCoins(payCoins);
            } else {
                console.error(`[Fund.useEffect] Not enough balance to fund bet. Aggregate balance = ${payCoinsVal}. Coins:`, payCoins);
                setError(`Your wallet doesn't have enough balance to fund the bet`);
            }
        })
        .catch(error => setError(error.message) );
    }, [currentAccount]);

    const { signAndExecuteTransactionBlock } = useWalletKit();
    const fundBet = (bet: Bet, answer: string, payCoins: CoinStruct[]): Promise<any> => // TODO add type
    {
        console.debug(`[fundBet] Calling bet::fund on package: ${packageId}`);

        const tx = new TransactionBlock();
        tx.moveCall({
            target: `${packageId}::bet::fund`, // TODO: reimplement. https://github.com/MystenLabs/sui/issues/9991
            typeArguments: [ bet.collatType ],
            arguments: [
                tx.object(bet.id),
                tx.pure(answer),
                tx.makeMoveVec({objects: payCoins.map((coin: CoinStruct) => tx.object(coin.coinObjectId))}),
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
*/

    return <section className='bet-modal'>
        <h2>Fund bet</h2>
        Coming soon...<br/>
{/*
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
*/}
        <br/>
        <hr/>
    </section>;
}
