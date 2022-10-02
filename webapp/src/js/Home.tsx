import React, { useEffect } from 'react';

import { reloadClouds } from './lib/clouds';

export function Home(props) {
    useEffect(() => {
        document.title = `Got Beef?`;
        reloadClouds();
    }, []);
    return <React.Fragment>
        <div>
            <i>Got Beef?</i> is a dApp to create on-chain bets on the <a href='https://sui.io/' className='rainbow' target='_blank'>Sui network</a>.
            <br/>
            <br/>
            Rules:
            <br/>
            <ul>
                <li>Anybody can create a new bet between two or more players (up to 256).</li>
                <li>The winner is selected either by one judge or by a quorum of judges (up to 32).</li>
                <li>Funds can only be transferred to the winner or refunded back to the players.</li>
            </ul>
        </div>
    </React.Fragment>;
}
