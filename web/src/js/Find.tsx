import React, { useEffect, useState, SyntheticEvent } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { PaginatedEvents, SuiAddress } from '@mysten/sui.js';

import { AppContext } from './App';
import { FieldError } from './components/FieldError';
import { Bet, getBet, getConfig } from './lib/gotbeef';
import { timeAgo } from './lib/common';

export function Find()
{
    const {network, rpcProvider} = useOutletContext<AppContext>();
    const {packageId} = getConfig(network);

    const [betId, setBetId] = useState('');
    const [bet, setBet] = useState<Bet|null|undefined>(undefined);
    const [error, setError] = useState('');
    const [recentBets, setRecentBets] = useState<BetSummary[]>([]);

    useEffect(() => {
        document.title = 'Got Beef? - Find';
        loadRecentBets()
        .catch(error => {
            console.warn('[loadRecentBets]', error.stack);
            setError('[loadRecentBets] ' + error.message);
        });
    }, []);

    type BetSummary = {
        id: SuiAddress,
        title: string,
        time: number,
    };
    type CreateBetEventData = {
        bet_id: SuiAddress,
        bet_title: string,
    }
    const loadRecentBets = async () =>
    {
        const events: PaginatedEvents = await rpcProvider.queryEvents({
            query: { MoveEventType: packageId+'::bet::CreateBetEvent' },
            limit: 20,
            order: 'descending'
        });

        const bets: BetSummary[] = events.data.map(event => {
            const eventData = event.parsedJson as CreateBetEventData;
            return {
                id: eventData.bet_id,
                title: eventData.bet_title,
                time: Number(event.timestampMs||0),
            };
        });
        setRecentBets(bets);
    };

    const navigate = useNavigate();
    const onSubmitSearch = (e: SyntheticEvent) => {
        e.preventDefault();

        // Validate input
        const betIdClean = betId.trim()
        if ( betIdClean.match(/^0x[0-9a-fA-F]{64}$/) ) {
            setError('');
        } else {
            setBet(undefined);
            setError("that doesn't look like a valid address")
            return;
        }

        // Search
        getBet(network, rpcProvider, betIdClean).then(
        (bet: Bet|null) => {
            setBet(bet);
            bet && navigate('/bet/' + bet.id, {
                // state: { bet: bet } // No longer used
            });
        });
    };

    const ErrorSection = () => {
        if (bet !== null) {
            return <></>;
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

            <button type='submit' className='nes-btn is-primary'>SEARCH</button>

            <ErrorSection />

        </form>

        <br/>
        <br/>
        <h3 style={{marginBottom: '1em'}}>RECENT BETS</h3>
        {
            !recentBets.length ? 'Loading...' :
            recentBets.map((bet: BetSummary) =>
            <div key={bet.id}>
                <span style={{minWidth: '6.5em', display: 'inline-block', textAlign: 'right'}}>
                    {timeAgo(bet.time)}
                </span>
                &nbsp;
                <Link to={`/bet/${bet.id}`}>{bet.title}</Link>
                <hr/>
            </div>)
        }

    </React.Fragment>;
}
