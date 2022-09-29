import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { getBet, Bet } from './lib/sui_tools';

export function Find()
{
    useEffect(() => { document.title = 'Got Beef? - Find' }, []);

    const [betId, setBetId] = useState('0x7cc3830ea8dc83ebce35b0f166392abf1d0d54ac');
    const [bet, setBet] = useState(undefined);

    const navigate = useNavigate();
    const onSubmitSearch = (e) => {
        e.preventDefault();
        getBet(betId).then(
        (bet: Bet|null) => {
            setBet(bet);
            bet && navigate('/bet/' + betId, {
                state: { bet: bet }
            });
        });
    };

    const ErrorSection = () => {
        if (bet !== null) {
            return '';
        }
        return <section>
            <br/>
            <br/>
            <h2>Error</h2>
            Bet not found.
        </section>;
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

            <ErrorSection />

        </form>

    </React.Fragment>;
}
