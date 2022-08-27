import React from 'react';
import { useParams } from 'react-router-dom';

export function Fund(props) {
    let params = useParams();
    return <React.Fragment>
        <h2>Fund</h2>
        <div>
            Funding: {params.uid}
        </div>
    </React.Fragment>;
}
