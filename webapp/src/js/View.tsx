import React, { useEffect, useState } from 'react';
import { Link, useLocation, useOutletContext, useParams } from 'react-router-dom';

import { getBetObj, getPhaseName, getCollateralType } from './lib/sui_tools';
import { ButtonConnect } from './components/ButtonConnect';
import { Fund } from './Fund';
import { Vote } from './Vote';
import { Cancel } from './Cancel';

export function View()
{
    /* Data */

    const [connected, setConnected] = useOutletContext();
    const betId = useParams().uid;
    const [betObj, setBetObj] = useState(undefined);
    const [modalHtml, setModalHtml] = useState(undefined);

    /* Load bet object data */

    const location = useLocation();
    useEffect(() => {
        document.title = `got beef? - View: ${betId}`;
        if (location.state && location.state.betObj) {
            // Reuse the bet object data that Find.tsx has already fetched
            setBetObj(location.state.betObj);
        } else {
            // The user came directly to this URL, fetch bet object from Sui
            getBetObj(betId).then( (bet: object|null) => {
                setBetObj(bet);
            });
        }
    }, []);

    /* Render */

    if (typeof betObj === 'undefined')
        return <React.Fragment>Loading</React.Fragment>;

    if (betObj === null)
        return <React.Fragment>Bet not found.</React.Fragment>;

    const actionsHtml = !connected
        ? <ButtonConnect connected={connected} setConnected={setConnected} />
        : <div id='bet-actions'>
            <button type='button' className='nes-btn is-success'
                onClick={() => setModalHtml(<Fund betObj={betObj} setBetObj={setBetObj}/>)}>
                Fund
            </button>
            <button type='button' className='nes-btn is-primary'
                onClick={() => setModalHtml(<Vote betObj={betObj} setBetObj={setBetObj}/>)}>
                Vote
            </button>
            <button type='button' className='nes-btn is-error'
                onClick={() => setModalHtml(<Cancel betObj={betObj} setBetObj={setBetObj}/>)}>
                Cancel
            </button>
        </div>;

    let fields = betObj.details.data.fields;
    const infoHtml = <React.Fragment>
        <h2>Bet info</h2>
        <div>
            Bet ID: {betId} <br/>
            <hr/>
            Title: {fields.title} <br/>
            Phase: {getPhaseName(betObj)} <br/>
            Description: {fields.description} <br/>
            <hr/>
            Bet size: {fields.bet_size} <br/>
            Currency: {getCollateralType(betObj)} <br/>
            <hr/>
            Players: {JSON.stringify(fields.players, null, 2)} <br/>
            Funds: {JSON.stringify(fields.funds.fields.contents, null, 2)} <br/>
            Winner: {JSON.stringify(fields.winner.fields.vec, null, 2)} <br/>
            {/*most_votes: {fields.most_votes} <br/>*/}
            <hr/>
            Judges: {JSON.stringify(fields.judges, null, 2)} <br/>
            Votes: {JSON.stringify(fields.votes.fields.contents, null, 2)} <br/>
            Quorum: {fields.quorum} <br/>
        </div>
    </React.Fragment>;

    return <React.Fragment>
        <section className='showcase'>
            <section className='nes-container with-title'>
                <h3 className='title'>Actions</h3>
                <div id='bet-actions'>
                    { actionsHtml }
                </div>
            </section>
        </section>
        <br/>
        { modalHtml }
        { infoHtml }
    </React.Fragment>;

}
