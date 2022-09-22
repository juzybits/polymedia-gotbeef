import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import { getBet } from './lib/sui_tools';

export function View(props)
{
    const [data, setData] = useState(null);
    let betObjId = useParams().uid;

    useEffect(() => {
        if (!data) {
            fetchBetData();
        }
    }, []);

    const fetchBetData = () => {
        getBet(betObjId)
        .then(bet => {
            console.debug("[view] Success:\n", bet);
            setData(bet.details.data.fields);
        })
        .catch(error => {
            console.warn("[view] Error:\n", error);
        });
    }

    return <React.Fragment>
        <h2>View</h2>
        <div>
            Viewing: {betObjId}
            <br/>
            <br/>
            Data:
            <br/>
            <pre>
                { JSON.stringify(data, null, 2) }
            </pre>
        </div>
    </React.Fragment>;
}
