import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { FieldError } from './components/FieldError';
import { isProd } from './lib/common';
import { getBet, Bet } from './lib/sui_tools';

export function Find()
{
    useEffect(() => {
        document.title = 'Got Beef? - Find';
    }, []);

    const [betId, setBetId] = useState(isProd ? '' : '0x9c26f68fceea2048c7d878d511bdd5ea60661803');
    const [bet, setBet] = useState(undefined);
    const [error, setError] = useState('');

    const navigate = useNavigate();
    const onSubmitSearch = (e) => {
        e.preventDefault();

        // Validate input
        const betIdClean = betId.trim()
        if ( betIdClean.match(/^0x[0-9a-fA-F]+$/) ) {
            setError('');
        } else {
            setError("that doesn't look like a valid address")
            return;
        }

        // Search
        getBet(betIdClean).then(
        (bet: Bet|null) => {
            setBet(bet);
            bet && navigate('/bet/' + bet.id, {
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
            <h2>Error</h2>
            Bet not found.
        </section>;
    }

    return <React.Fragment>

        <h2>FIND BET</h2>

        <form onSubmit={onSubmitSearch}>

            <div className='nes-field'>
                <label htmlFor='uid_field'>Object ID</label>
                <input type='text' id='uid_field' className={`nes-input ${error ? 'is-error' : ''}`}
                    spellCheck='false' autoCorrect='off' autoComplete='off'
                    value={betId} onChange={(e) => setBetId(e.target.value)}
               />
            </div>
            <FieldError error={error} />
            <br/>

            <button type='submit' className='nes-btn is-primary'>Search</button>

            <ErrorSection />

        </form>

    </React.Fragment>;
}
