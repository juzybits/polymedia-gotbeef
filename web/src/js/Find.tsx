import React, { useEffect, useState, SyntheticEvent } from 'react';
// import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { useNavigate, useOutletContext } from 'react-router-dom';

import { FieldError } from './components/FieldError';
import { Bet, getBet } from './lib/beef';
// import { timeAgo } from './lib/common';

export function Find()
{
    const [network] = useOutletContext<string>();

    useEffect(() => {
        document.title = 'Got Beef? - Find';
        // Reload recent transaction list
        // getRecentTxns(network, 18) // TODO: reimplement
        // .then(txnData => {
        //     const txns = txnData.reduce((selected: object[], txn: any) => {
        //         const cert = txn.certificate;
        //         const call = cert.data.transactions[0].Call;
        //         const effects = txn.effects;
        //         if (call.function == 'create' && effects.status.status == 'success') {
        //             selected.push({
        //                 time: txn.timestamp_ms,
        //                 betId: effects.created[0].reference.objectId,
        //                 name: cert.data.transactions[0].Call.arguments[0],
        //                 // amount: cert.data.transactions[0].Call.arguments[3],
        //                 // txnId: cert.transactionDigest,
        //                 // func: call.function,
        //                 // status: effects.status.status,
        //             });
        //         }
        //         /*
        //         else {
        //             const betUrl = 'https://explorer.devnet.sui.io/objects/' + encodeURIComponent(cert.data.transactions[0].Call.arguments[0]);
        //             const txnUrl = 'https://explorer.devnet.sui.io/transactions/' + encodeURIComponent(cert.transactionDigest);
        //             const status = effects.status.status;
        //             const error = effects.status.error ? (getErrorName(effects.status.error)+' | '+effects.status.error) : '';

        //             // console.log(txn);
        //             console.log(timeAgo(txn.timestamp_ms), call.function, status, betUrl, txnUrl, '\n'+(error||''));
        //         }
        //         */
        //         return selected;
        //     }, []);
        //     setRecentBets(txns);
        // });
    }, []);

    const [betId, setBetId] = useState('');
    const [bet, setBet]: any[] = useState(undefined);
    const [error, setError] = useState('');
    // const [recentBets, setRecentBets]: any[] = useState([]);

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
        getBet(network, betIdClean).then(
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

{/*
        <br/>
        <br/>
        <h3 style={{marginBottom: '1em'}}>RECENT BETS</h3>
        {
            recentBets.slice(0, 9).map((txn: any) => <div key={txn.betId}>
                <span style={{minWidth: '6.5em', display: 'inline-block', textAlign: 'right'}}>
                    {timeAgo(txn.time)}
                </span>
                &nbsp;
                <Link to={`/bet/${txn.betId}`}>{txn.name}</Link>
                <hr/>
            </div>)
        }
*/}

    </React.Fragment>;
}
