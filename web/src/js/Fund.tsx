import React, { useEffect, useState } from 'react';
import { SuiTransactionResponse } from '@mysten/sui.js';
import { useWallet } from "@mysten/wallet-adapter-react";

import { GOTBEEF_PACKAGE, Bet, getErrorName, getCoinObjects } from './lib/sui_tools';
import { showConfetti } from './lib/confetti';

export function Fund(props: any) {

    const [payCoins, setPayCoins]: any[] = useState(undefined);
    const [error, setError] = useState('');
    const GAS_BUDGET = 10000;

    // Look for a Coin<T> with enough balance to fund the bet
    const { getAccounts } = useWallet();
    useEffect(() =>
    {
        getAccounts().then(addresses => {
            getCoinObjects(addresses[0], props.bet.collatType)
            .then(coins => {
                let smallestCoin = null; // to pay for gas
                let payCoins = []; // to fund the bet
                let payCoinsVal = 0; // sum of `payCoins` balances

                for ( const coin of coins ) {
                    if (smallestCoin === null) {
                        smallestCoin = coin;
                        continue;
                    }
                    let coinVal = coin.details.data.fields.balance;
                    let smallestVal = smallestCoin.details.data.fields.balance;
                    if (coinVal < smallestVal && coinVal >= GAS_BUDGET) {
                        payCoins.push(smallestCoin);
                        payCoinsVal += smallestVal;
                        smallestCoin = coin;
                        continue;
                    }
                    payCoins.push(coin);
                    payCoinsVal += coinVal;
                    if (payCoinsVal >= props.bet.size) {
                        break;
                    }
                }

                if (payCoinsVal >= props.bet.size) {
                    console.debug(`[Fund.useEffect] Found coins to fund bet. Aggregate balance = ${payCoinsVal}. Coins:`, payCoins);
                    setPayCoins(payCoins);
                } else {
                    console.error(`[Fund.useEffect] Not enough balance to fund bet. Aggregate balance = ${payCoinsVal}. Coins:`, payCoins);
                    setPayCoins(null);
                    setError(`Your wallet doesn't have enough balance to fund the bet`);
                }
            })
            .catch(error => setError(error.message) );
        });
    }, []);

    const { signAndExecuteTransaction } = useWallet();
    const fundBet = (bet: Bet, coin: string): Promise<SuiTransactionResponse> =>
    {
        console.debug(`[fundBet] Calling bet::fund on package: ${GOTBEEF_PACKAGE}`);
        return signAndExecuteTransaction({
            kind: 'moveCall',
            data: {
                packageObjectId: GOTBEEF_PACKAGE,
                module: 'bet',
                function: 'fund',
                typeArguments: [ bet.collatType ],
                arguments: [
                    bet.id,
                    payCoins.map((coin: any) => coin.details.reference.objectId),
                ],
                gasBudget: GAS_BUDGET,
            }
        });
    };

    const onClickFund = () =>
    {
        fundBet(props.bet, payCoins)
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
            setError( getErrorName(error.message) );
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
            <br/>
            <button type='button' className={`nes-btn ${payCoins ? 'is-success' : 'is-disabled'}`} disabled={!payCoins} onClick={onClickFund}>
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
