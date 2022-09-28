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
    const [modal, setModal] = useState(undefined);

    /* Load bet object data */

    const reloadBet = () => {
        getbet(betId).then( (bet: Bet|null) => {
            setBet(bet);
        });
    };

    const location = useLocation();
    useEffect(() => {
        document.title = `got beef? - View: ${betId}`;
        if (location.state && location.state.bet) {
            // Reuse the bet object data that Find.tsx has already fetched
            setBet(location.state.bet);
        } else {
            // The user came directly to this URL, fetch bet object from Sui
            reloadBet();
        }
    }, []);

    /* Render */

    if (typeof bet === 'undefined')
        return <React.Fragment>Loading</React.Fragment>;

    if (bet === null)
        return <React.Fragment>Bet not found.</React.Fragment>;

    return <React.Fragment>
    {
        modal ? modal :
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
                            onClick={() => setModal(<Fund bet={bet} reloadBet={reloadBet} setModal={setModal} />)}>
                            Fund
                        </button>
                        <button type='button' className='nes-btn is-success'
                            onClick={() => setModal(<Vote bet={bet} reloadBet={reloadBet} setModal={setModal} />)}>
                            Vote
                        </button>
                        <button type='button' className='nes-btn is-error'
                            onClick={() => setModal(<Cancel bet={bet} reloadBet={reloadBet} setModal={setModal} />)}>
                            Cancel
                        </button>
                    </div>
                }
                </div>
            </section>
        </section>
    }
    <br/>

    <h2>{bet.title}</h2>

    <label className='field-label'>ID:</label><a href={'https://explorer.devnet.sui.io/objects/'+betId} className='rainbow' target='_blank'>{shorten(betId)}</a>
    <br/>
    {
        bet.winner ?
        <React.Fragment>
            <label className='field-label'>&nbsp;<i className='nes-icon trophy is-small' />:</label>{shorten(bet.winner)}
            <br/>
        </React.Fragment> : ''
    }
    <label className='field-label'>Phase:</label><span style={{color: phaseColor(bet.phase)}}>{bet.phase}</span>
    <br/>
    <label className='field-label'>Size:</label>{bet.size} <i className='nes-icon coin is-small' /> {bet.collatType}
    <br/>
    <label className='field-label'>Quorum:</label>{bet.quorum}/{bet.judges.length}
    <br/>
    {
        !bet.description ? '' : <React.Fragment>
            <label className='x'>Description:</label>{bet.description}
            <br/>
        </React.Fragment>
    }

    <table>
        <thead>
            <tr>
                <th><i className='snes-jp-logo custom-logo' /> Player</th>
                <th>Funds</th>
                <th>Votes</th>
            </tr>
        </thead>
        <tbody>
        {
            bet.players.map(player_addr => <React.Fragment key={player_addr}>
                <tr>
                    <td>{shorten(player_addr)}</td>
                    <td>{bet.funds.get(player_addr) || '0'}</td>
                    <td>{bet.votesByPlayer.get(player_addr) || '0'}</td>
                </tr>
            </React.Fragment>)
        }
        </tbody>
    </table>
    <br/>

    <table>
        <thead>
            <tr>
                <th><i className='nes-logo custom-logo' /> Judge</th>
                <th>Vote</th>
            </tr>
        </thead>
        <tbody>
        {
            bet.judges.map(judge_addr => <React.Fragment key={judge_addr}>
            <tr>
                <td>{shorten(judge_addr)}</td>
                <td>{shorten(bet.votesByJudge.get(judge_addr)) || '-'}</td>
            </tr>
            </React.Fragment>)
        }
        </tbody>
    </table>
    <br/>

    </React.Fragment>;
}

function shorten(addr: string): string {
    return !addr ? '' : addr.slice(0, 6) + '...' + addr.slice(-4);
}

const phaseColors = new Map([
    ['funding', '#92cc41'],
    ['voting', '#92cc41'],
    ['settled', 'grey'],
    ['canceled', '#e76e55'],
    ['stalemate', '#e76e55'],
]);

function phaseColor(phaseName: string): string {
    return phaseColors.get(phaseName);
}
