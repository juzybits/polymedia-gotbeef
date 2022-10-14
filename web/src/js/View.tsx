import React, { useEffect, useState } from 'react';
import { Link, useLocation, useOutletContext, useParams } from 'react-router-dom';

import { ButtonConnect } from './components/ButtonConnect';
import { Fund } from './Fund';
import { Vote } from './Vote';
import { Cancel } from './Cancel';
import { getBet, Bet, getAddresses } from './lib/sui_tools';

export function View()
{
    /* Data */

    const [connected, setConnected] = useOutletContext();
    const betId = useParams().uid;
    const [bet, setBet] = useState(undefined);
    const [modal, setModal] = useState(undefined);
    const [isPlayer, setIsPlayer] = useState(undefined);
    const [isJudge, setIsJudge] = useState(undefined);
    const [userCanFund, setUserCanFund] = useState(undefined);
    const [userCanVote, setUserCanVote] = useState(undefined);
    const [userCanCancel, setUserCanCancel] = useState(undefined);

    /* Load bet object data */

    const reloadBet = () => {
        getBet(betId).then( (bet: Bet|null) => {
            setBet(bet);
        });
    };

    const location = useLocation();
    useEffect(() => {
        document.title = `Got Beef? - View: ${betId}`;
        if (location.state && location.state.bet) {
            // Reuse the bet object data that Find.tsx has already fetched
            setBet(location.state.bet);
        } else {
            // The user came directly to this URL, fetch bet object from Sui
            reloadBet();
        }
    }, []);

    /* Decide which action buttons are visible to the user */

    useEffect(() => {
        if (!connected || !bet) {
            return;
        }
        getAddresses().then(addresses => {
            const userAddr = addresses[0];
            const isJudge = bet.judges.includes(userAddr);
            const isPlayer = bet.players.includes(userAddr);
            setIsPlayer(isPlayer);
            setIsJudge(isJudge);
            setUserCanFund( isPlayer && bet.phase == 'funding' && !bet.funds.has(userAddr) );
            setUserCanVote( isJudge && bet.phase == 'voting' && !bet.votesByJudge.has(userAddr) );
            setUserCanCancel( (isPlayer||isJudge) && bet.phase == 'funding' && bet.funds.size == 0 );
        });
    }, [connected, bet]);

    /* Render */

    if (typeof bet === 'undefined')
        return <React.Fragment>Loading</React.Fragment>;

    if (bet === null)
        return <React.Fragment>Bet not found.</React.Fragment>;

    return <React.Fragment>
    {
        modal ||
        // Show action only if we're not inside of a modal (fund/vote/cancel)
        (
            // Show actions only if the bet is not already settled/canceled/stalemate
            (bet.phase=='voting' || bet.phase=='funding') &&
            <section id='bet-actions-container' className='nes-container with-title'>
                <h3 className='title'>Actions</h3>
                <div id='bet-actions'>
                {
                    !connected
                    ? <ButtonConnect connected={connected} setConnected={setConnected} />
                    : <div id='bet-actions'>

                        {userCanFund &&
                        <button type='button' className='nes-btn is-success'
                            onClick={() => setModal(<Fund bet={bet} reloadBet={reloadBet} setModal={setModal} />)}>
                            Fund
                        </button>}

                        {userCanVote &&
                        <button type='button' className='nes-btn is-success'
                            onClick={() => setModal(<Vote bet={bet} reloadBet={reloadBet} setModal={setModal} />)}>
                            Vote
                        </button>}

                        {userCanCancel &&
                        <button type='button' className='nes-btn is-error'
                            onClick={() => setModal(<Cancel bet={bet} reloadBet={reloadBet} setModal={setModal} />)}>
                            Cancel
                        </button>}

                        {
                            (isPlayer===false && isJudge===false)
                            ? <i style={{fontSize: '0.9em'}}>
                                Your address is not a participant in this bet
                            </i>
                            : (userCanFund===false && userCanVote===false && userCanCancel===false) &&
                            <i style={{fontSize: '0.9em'}}>
                                No actions available at this time
                            </i>
                        }
                    </div>
                }
                </div>
            </section>
        )
    }

    <h2 style={{marginBottom: '0.8em'}}>{bet.title}</h2>

    <table id='bet-summary'>
        <tbody>
            <tr>
                <td>ID:</td>
                <td><a href={'https://explorer.devnet.sui.io/objects/'+betId} className='rainbow' target='_blank'>{shorten(betId)}</a></td>
            </tr>
            {
            !bet.winner ? '' :
            <tr>
                <td>&nbsp;<i className='nes-icon trophy is-small' />:</td>
                <td>{shorten(bet.winner)}</td>
            </tr>
            }
            <tr>
                <td>Phase:</td>
                <td><span style={{color: phaseColor(bet.phase)}}>{bet.phase}</span></td>
            </tr>
            <tr>
                <td>Size:</td>
                <td>{bet.size} <i className='nes-icon coin is-small' /> {bet.collatType}</td>
            </tr>
            <tr>
                <td>Quorum:</td>
                <td>{bet.quorum}/{bet.judges.length}</td>
            </tr>
            {
            !bet.description ? '' :
            <tr>
                <td>Details:</td>
                <td>{bet.description}</td>
            </tr>
            }
        </tbody>
    </table>

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