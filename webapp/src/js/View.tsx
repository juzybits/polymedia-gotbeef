import React, { useEffect, useState } from 'react';
import { Link, useLocation, useOutletContext, useParams } from 'react-router-dom';

import { getBet } from './lib/sui_tools';
import { ButtonConnect } from './components/ButtonConnect';
import { Fund } from './Fund';
import { Vote } from './Vote';
import { Cancel } from './Cancel';

export function View()
{
    /* Data */

    const betObjId = useParams().uid;
    const [connected, setConnected] = useOutletContext();
    const [data, setData] = useState(undefined);
    const [modalHtml, setModalHtml] = useState(undefined);

    /* Refresh */

    const location = useLocation();
    useEffect(() => {
        document.title = `got beef? - View: ${betObjId}`;
        // Do this only once
        if (!data) {
            // Was the Bet object data already fetched by the previous page (Find.tsx)
            if (location.state && location.state.data) {
                setData(location.state.data);
            } else {
                fetchBetData();
            }
        }
    }, []);

    /* Helpers */

    const fetchBetData = (): void => {
        getBet(betObjId)
        .then(bet => {
            // TODO: validate object type. See onSubmitSearch() in Find.tsx
            setData(bet.details.data.fields);
        })
        .catch(error => {
            setData(null);
        });
    };

    const getPhaseName = (phaseCode: number): string => {
        return ['fund', 'vote', 'settled', 'canceled', 'stalemate'][phaseCode];
    };

    const getCollateralType = (vaultType: string): string => {
        const match = vaultType.match(/, (0x.*)>/);
        return match ? match[1] : 'ERROR_TYPE_NOT_FOUND';
    };

    /* Render */

    if (typeof data === 'undefined')
        return <React.Fragment>Loading</React.Fragment>;

    if (data === null)
        return <React.Fragment>Not found</React.Fragment>;

    const actionsHtml = !connected
        ? <ButtonConnect connected={connected} setConnected={setConnected} />
        : <div id='bet-actions'>
            <button type='button' className='nes-btn is-success'
                onClick={() => setModalHtml(<Fund betObjId={betObjId} data={data} setData={setData}/>)}>
                Fund
            </button>
            <button type='button' className='nes-btn is-primary'
                onClick={() => setModalHtml(<Vote betObjId={betObjId} data={data} setData={setData}/>)}>
                Vote
            </button>
            <button type='button' className='nes-btn is-error'
                onClick={() => setModalHtml(<Cancel betObjId={betObjId} data={data} setData={setData}/>)}>
                Cancel
            </button>
        </div>;

    const infoHtml = <React.Fragment>
        <h2>Bet info</h2>
        <div>
            Bet ID: {betObjId} <br/>
            <hr/>
            Title: {data.title} <br/>
            Phase: {getPhaseName(data.phase)} <br/>
            Description: {data.description} <br/>
            <hr/>
            Bet size: {data.bet_size} <br/>
            Currency: {getCollateralType(data.funds.type)} <br/>
            <hr/>
            Players: {JSON.stringify(data.players, null, 2)} <br/>
            Funds: {JSON.stringify(data.funds.fields.contents, null, 2)} <br/>
            Winner: {JSON.stringify(data.winner.fields.vec, null, 2)} <br/>
            {/*most_votes: {data.most_votes} <br/>*/}
            <hr/>
            Judges: {JSON.stringify(data.judges, null, 2)} <br/>
            Votes: {JSON.stringify(data.votes.fields.contents, null, 2)} <br/>
            Quorum: {data.quorum} <br/>
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
