import React from 'react';
import { useParams } from 'react-router-dom';

export function View(props) {
    let params = useParams();
    return <React.Fragment>
        <h2>View</h2>
        <div>
            Viewing: {params.uid}
        </div>
    </React.Fragment>;
}
