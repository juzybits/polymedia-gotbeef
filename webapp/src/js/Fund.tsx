import React, { useEffect, useState } from 'react';

import { fundBet, getCoinObjects } from './lib/sui_tools';

export function Fund(props) {

    const [coins, setCoins] = useState(undefined);

    useEffect(() => {
        typeof coins === 'undefined' &&
        getCoinObjects(props.bet.collat_type).then(coins => {
            // TODO: check if the user has enough Coin<T> to fund the bet
            console.debug('Address coins:', coins);
            setCoins(coins);
        })
        .catch(error => {
            console.debug('Failed to fetch address objects. Error:', error);
        });
    }, []);

    const onClickFund = () => {
        const coin = coins[0].objectId; // TODO find appropriate Coin<T> in user wallet
        console.debug("[onClickFund] Paying with coin:", coin);
        fundBet(props.bet, coin)
        .then(resp => {
            if (resp.effects.status.status == 'success') {
                // setError(undefined);
                console.log("Success:", resp); // TODO Remove
                // TODO setBet
            } else {
                console.log("Error1:", resp); // TODO Remove
                // setError( getErrorName(resp.effects.status.error) );
            }
        })
        .catch(error => {
            console.log("Error2:", error); // TODO Remove
            // setError(error.message);
        });
    };

    return <React.Fragment>
        <h2>Fund bet</h2>
        <div>
            Bet size is {props.bet.size} <i className="nes-icon coin is-small" /> {props.bet.collat_type}
            <br/>
            <br/>
            <button type='button' className='nes-btn is-success' onClick={onClickFund}>
                Fund
            </button>
        </div>
        <br/>
        <hr/>
        <br/>
    </React.Fragment>;
}
