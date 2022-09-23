import React, { useEffect, useState } from 'react';
import { useOutletContext, useParams } from 'react-router-dom';

import { getBet } from './lib/sui_tools';
import { ButtonConnect } from './components/ButtonConnect';

export function View(props)
{
    const [connected, setConnected] = useOutletContext();
    const [data, setData] = useState(undefined);
    const betObjId = useParams().uid;

    useEffect(() => {
        document.title = `got beef? - View: ${betObjId}`;
        if (!data) {
            fetchBetData();
        }
    }, []);

    const fetchBetData = (): void => {
        getBet(betObjId)
        .then(bet => {
            console.debug('[bet] Success:\n', bet);
            setData(bet.details.data.fields);
        })
        .catch(error => {
            console.warn('[bet] Error:\n', error);
            setData(null);
        });
    }

    const getPhaseName = (phaseCode: number): string => {
        return ['fund', 'vote', 'settled', 'canceled', 'stalemate'][phaseCode];
    }

    const getCollateralType = (vaultType: string): string => {
        let match = vaultType.match(/, (0x.*)>/);
        return match ? match[1] : 'ERROR_TYPE_NOT_FOUND';
    }

    const makeHtml = () => {
        if (typeof data === 'undefined')
            return <React.Fragment>Loading</React.Fragment>;

        if (data === null)
            return <React.Fragment>Not found</React.Fragment>;

        let actions = !connected
            ? <ButtonConnect connected={connected} setConnected={setConnected} />
            : <div id='bet-actions'>
                <button type='button' className='nes-btn is-success'>Fund</button>
                <button type='button' className='nes-btn is-primary'>Vote</button>
                <button type='button' className='nes-btn is-error'>Cancel</button>
            </div>;

        return <React.Fragment>
            <section className='showcase'>
                <section className='nes-container with-title'>
                    <h3 className='title'>Actions</h3>
                    <div id='bet-actions'>
                        {actions}
                    </div>
                </section>
            </section>

            <br/>

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
    }

    return <React.Fragment>
        <h2>View</h2>
        { makeHtml() }
    </React.Fragment>;
}
