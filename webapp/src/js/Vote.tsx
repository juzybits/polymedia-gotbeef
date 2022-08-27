import React from 'react';
import { useParams } from 'react-router-dom';

export function Vote(props) {
    let params = useParams();
    return <React.Fragment>
        <h2>Vote</h2>
        <div>
            Voting: {params.uid}
        </div>
    </React.Fragment>;
}
