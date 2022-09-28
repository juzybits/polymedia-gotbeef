import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { getbet, Bet } from './lib/sui_tools';

export function Find()
{
    useEffect(() => { document.title = 'got beef? - Find' }, []);

    const [betId, setBetId] = useState('0xee12e4894430ee828a4df64a7f9edf7df3993931');
    const [bet, setBet] = useState(undefined);

    const navigate = useNavigate();
    const onSubmitSearch = (e) => {
        e.preventDefault();
        getbet(betId).then(
        (bet: Bet|null) => {
            setBet(bet);
            bet && navigate('/bet/' + betId, {
                state: { bet: bet }
            });
        });
    };

    const makeErrorHtml = () => {
        if (bet !== null) {
            return '';
        }
        return <React.Fragment>
            <br/>
            <br/>
            <h2>Error</h2>
            Bet not found.
        </React.Fragment>
    }

    return <React.Fragment>

        <h2>FIND BET</h2>

        <form onSubmit={onSubmitSearch}>

            <div className='nes-field'>
                <label htmlFor='uid_field'>Object ID</label>
                <input type='text' id='uid_field' className='nes-input'
                    spellCheck='false' autoCorrect='off' autoComplete='off'
                    value={betId} onChange={(e) => setBetId(e.target.value)}
               />
            </div>
            <br/>

            <button type='submit' className='nes-btn is-primary'>Search</button>

            { makeErrorHtml() }

        </form>

    </React.Fragment>;
}
