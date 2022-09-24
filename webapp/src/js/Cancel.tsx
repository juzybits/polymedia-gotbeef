import React from 'react';
import { useParams, useOutletContext } from 'react-router-dom';

export function Cancel(props) {
    let params = useParams();
    const [data, setData] = useOutletContext();
    return <React.Fragment>
        <h2>Cancel bet</h2>
        <div>
            Canceling: {params.uid}
        </div>
        <br/>
    </React.Fragment>;
}
