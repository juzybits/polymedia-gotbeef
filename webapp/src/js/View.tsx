import React, { useEffect, useState } from 'react';
import { Link, useLocation, useOutletContext, useParams } from 'react-router-dom';

import { getbet, Bet } from './lib/sui_tools';
import { ButtonConnect } from './components/ButtonConnect';
import { Fund } from './Fund';
import { Vote } from './Vote';
import { Cancel } from './Cancel';

export function View()
{
    /* Data */

    const [connected, setConnected] = useOutletContext();
    const betId = useParams().uid;
    const [bet, setBet] = useState(undefined);
    const [modalHtml, setModalHtml] = useState(undefined);

    /* Load bet object data */

    const location = useLocation();
    useEffect(() => {
        document.title = `got beef? - View: ${betId}`;
        if (location.state && location.state.bet) {
            // Reuse the bet object data that Find.tsx has already fetched
            setBet(location.state.bet);
        } else {
            // The user came directly to this URL, fetch bet object from Sui
            getbet(betId).then( (bet: Bet|null) => {
                setBet(bet);
            });
        }
    }, []);

    /* Render */

    if (typeof bet === 'undefined')
        return <React.Fragment>Loading</React.Fragment>;

    if (bet === null)
        return <React.Fragment>Bet not found.</React.Fragment>;

    return <React.Fragment>

    <section className='showcase'>
        <section className='nes-container with-title'>
            <h3 className='title'>Actions</h3>
            <div id='bet-actions'>
            {
                !connected
                ? <ButtonConnect connected={connected} setConnected={setConnected} />
                : <div id='bet-actions'>
                    {/* TODO: only show the action buttons that the user address can use */}
                    <button type='button' className='nes-btn is-success'
                        onClick={() => setModalHtml(<Fund bet={bet} setBet={setBet}/>)}>
                        Fund
                    </button>
                    <button type='button' className='nes-btn is-success'
                        onClick={() => setModalHtml(<Vote bet={bet} setBet={setBet}/>)}>
                        Vote
                    </button>
                    <button type='button' className='nes-btn is-error'
                        onClick={() => setModalHtml(<Cancel bet={bet} setBet={setBet}/>)}>
                        Cancel
                    </button>
                </div>
            }
            </div>
        </section>
    </section>
    <br/>

    { modalHtml }

    <h2>{bet.title}</h2>

    ID: <a href={'https://explorer.devnet.sui.io/objects/'+betId} className='rainbow' target='_blank'>{betId}</a> <br/>
    {
        !bet.winner || bet.winner.type ? '' : <React.Fragment>
            &nbsp;<i className='nes-icon trophy is-small' />: {bet.winner} <br/>
        </React.Fragment>
    }
    Size: {bet.size} <i className='nes-icon coin is-small' /> {bet.collat_type} <br/>
    Phase: {bet.phase}<br/>
    Quorum: {bet.quorum}/{bet.judges.length}<br/>
    {
        !bet.description ? '' : <React.Fragment>
            Description: {bet.description}<br/>
        </React.Fragment>
    }
    <br/>

{/*        Players: {JSON.stringify(bet.players, null, 2)} <br/>
    Funds: {JSON.stringify(bet.funds.fields.contents, null, 2)} <br/>*/}

    <table>
        <thead>
            <tr>
                <th><i className='snes-jp-logo custom-logo' /> Players</th>
                <th>Funded</th>
                <th>Votes</th>
            </tr>
        </thead>
        <tbody>
        {
        bet.players.map(addr => <React.Fragment key={addr}>
            <tr>
                <td>{shorten(addr)}</td>
                <td>{bet.funds.get(addr) || '0'}</td>
                <td>todo</td>
            </tr>
        </React.Fragment>)
        }
        </tbody>
    </table>
    <br/>

        {/*most_votes: {bet.most_votes} <br/>*/}
{/*        Judges: {JSON.stringify(bet.judges, null, 2)} <br/>
        Votes: {JSON.stringify(bet.votes.fields.contents, null, 2)} <br/>*/}

    <table>
        <thead>
            <tr>
                <th><i className='nes-logo custom-logo' /> Judges</th>
                <th>Voted</th>
            </tr>
        </thead>
        <tbody>
        {
            bet.judges.map(addr => <React.Fragment key={addr}>
            <tr>
                <td>{shorten(addr)}</td>
                <td>todo</td>
            </tr>
            </React.Fragment>)
        }
        </tbody>
    </table>
    <br/>

    </React.Fragment>;
}

function shorten(addr: string): string {
    return addr.slice(0, 6) + '...' + addr.slice(-4);
}
