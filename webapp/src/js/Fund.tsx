import React from 'react';
import { useParams, useOutletContext } from 'react-router-dom';

export function Fund(props) {
    let params = useParams();
    const [data, setData] = useOutletContext();
    return <React.Fragment>
        <h2>Fund bet</h2>
        <div>
            Funding: {params.uid}
        </div>
        <br/>
    </React.Fragment>;
}
