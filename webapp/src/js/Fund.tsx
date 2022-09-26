import React, { useEffect } from 'react';

import { fundBet, getCollateralType } from './lib/sui_tools';

export function Fund(props) {

    useEffect(() => {
        // TODO: check if the user has enough Coin<T> to fund the bet
    });

    const onClickFund = () => {
        console.log("TODO: onClickFund()");
        fundBet(props.betObj)
        .then(resp => {
            if (resp.effects.status.status == 'success') {
                // setError(undefined);
                console.log("Success:", resp); // TODO Remove
                // TODO setBetObj
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
            Bet size is {props.betObj.details.data.fields.bet_size} <i className="nes-icon coin is-small" /> {getCollateralType(props.betObj)}
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
