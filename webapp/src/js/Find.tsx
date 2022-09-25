import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { getBetObj } from './lib/sui_tools';

export function Find()
{
    useEffect(() => { document.title = 'got beef? - Find' }, []);

    const [betId, setBetId] = useState('0x2c406118770cce6ddcaa8b17048de0ca3d234d94');
    const [betObj, setBetObj] = useState(undefined);

    const navigate = useNavigate();
    const onSubmitSearch = (e) => {
        e.preventDefault();
        getBetObj(betId).then(
        (bet: object|null) => {
            setBetObj(bet);
            bet && navigate('/bet/' + betId, {
                state: { betObj: bet }
            });
        });
    };

    const makeErrorHtml = () => {
        if (betObj !== null) {
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
