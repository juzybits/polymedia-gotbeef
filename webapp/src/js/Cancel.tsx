import React from 'react';

import { cancelBet } from './lib/sui_tools';

export function Cancel(props) {

    const onClickCancel = () => {
        console.log("TODO: onClickCancel()");
        cancelBet(props.betObj)
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
        <h2>Cancel bet</h2>
        <div>
            The bet can still be cancelled because nobody has funded it yet.
            <br/>
            <br/>
            <button type='button' className='nes-btn is-error' onClick={onClickCancel}>
                Cancel
            </button>
        </div>
        <br/>
        <hr/>
        <br/>
    </React.Fragment>;
}
