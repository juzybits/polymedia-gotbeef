import React, { useEffect } from 'react';

export function Home(props) {
    useEffect(() => {
        document.title = `got beef?`;
    }, []);
    return <React.Fragment>
        <div>
            <i>got beef?</i> is a dApp to create on-chain bets on the <a href='https://sui.io/' className='rainbow' target='_blank'>Sui network</a>.
            <br/>
            <br/>
            Rules:
            <br/>
            <ul>
                <li>Anybody can create a new bet between two or more players (up to 256).</li>
                <li>The winner is selected either by one judge or by a quorum of judges (up to 32).</li>
                <li>Funds can only be transferred to the winner or refunded back to the players.</li>
            </ul>
            <br/>
            <div id='built-by'>
                Built with <i className='nes-icon heart is-small'></i> by <a href='https://twitter.com/juzybits' className='rainbow' target='_blank'>@juzybits</a>
            </div>
        </div>
    </React.Fragment>;
}
