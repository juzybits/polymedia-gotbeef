import React from 'react';
import { useParams } from 'react-router-dom';

export function Cancel(props) {
    let params = useParams();
    return <React.Fragment>
        <h2>Cancel</h2>
        <div>
            Canceling: {params.uid}
        </div>
    </React.Fragment>;
}
