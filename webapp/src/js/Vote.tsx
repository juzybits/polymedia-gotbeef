import React from 'react';
import { useParams, useOutletContext } from 'react-router-dom';

export function Vote(props) {
    let params = useParams();
    const [data, setData] = useOutletContext();
    return <React.Fragment>
        <h2>Vote winner</h2>
        <div>
            Voting: {params.uid}
        </div>
        <br/>
    </React.Fragment>;
}
