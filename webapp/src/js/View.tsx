import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import { getBet } from './lib/sui_tools';

export function View(props)
{
    const [data, setData] = useState(null);
    let betObjId = useParams().uid;

    useEffect(() => {
        document.title = `got beef? - View: ${betObjId}`;
        if (!data) {
            fetchBetData();
        }
    }, []);

    const fetchBetData = () => {
        getBet(betObjId)
        .then(bet => {
            console.debug('[bet] Success:\n', bet);
            setData(bet.details.data.fields);
        })
        .catch(error => {
            console.warn('[bet] Error:\n', error);
            setData("Not Found");
        });
    }

    return <React.Fragment>
        <h2>View</h2>
        <div>
            Bet ID: {betObjId}
            <br/>
            <br/>
            {
                data
                ? <React.Fragment> Data: <br/> <pre>{ JSON.stringify(data, null, 2) }</pre> </React.Fragment>
                : 'loading'
            }
        </div>
    </React.Fragment>;
}
