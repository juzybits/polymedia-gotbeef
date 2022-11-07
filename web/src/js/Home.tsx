import React, { useEffect, useState } from 'react';

export function Home(props: any) {
    useEffect(() => {
        document.title = `Got Beef?`;
    }, []);

    const [showHowToPlay, setShowHowToPlay] = useState(false);
    const [showWhatIsFor, setShowWhatIsFor] = useState(false);
    const [showWhereAddr, setShowWhereAddr] = useState(false);

    const toggleSection = (section: string) => {
        if (section == 'section-how-to-play')
            setShowHowToPlay(!showHowToPlay);
        else if (section == 'section-what-is-for')
            setShowWhatIsFor(!showWhatIsFor);
        else if (section == 'section-where-addr')
            setShowWhereAddr(!showWhereAddr);
    }

    return <React.Fragment>
        <div>
            <p>
                <i>Got Beef?</i> is a dApp to create on-chain bets on the <a href='https://sui.io/' className='rainbow' target='_blank'>Sui network</a>.
            </p>

            <span className='section-title' onClick={() => toggleSection('section-how-to-play')}>{showHowToPlay?'-':'+'} <span>How to play:</span></span>
            {showHowToPlay &&
            <div className='section-body' id='section-how-to-play'>
                <ul>
                    <li>Anybody can create a new bet between two or more players (up to 256).</li>
                    <li>A new bet starts in the "funding" phase, which means players can fund the bet.</li>
                    <li>Once all players have sent their funds, the bet moves to the "voting" phase.</li>
                    <li>The winner is then selected by either one judge or by a quorum of judges (up to 32).</li>
                    <li>The code ensures that player funds can only be transferred to the winner, or refunded back to the players if the bet is cancelled.</li>
                </ul>
            </div>}

            <span className='section-title' onClick={() => toggleSection('section-what-is-for')}>{showWhatIsFor?'-':'+'} <span>What is this for?</span></span>
            {showWhatIsFor && <div className='section-body' id='section-what-is-for'>
                In a scenario&nbsp;
                <a href='https://twitter.com/GiganticRebirth/status/1503335929976664065' className='rainbow' target='_blank'>such as this one</a>, a <i>Got Beef?</i> bet could have been used:
                <ul>
                    <li>player 1 = GCR</li>
                    <li>player 2 = Do Kwon</li>
                    <li>judge&nbsp;&nbsp;&nbsp;&nbsp;= Cobie</li>
                </ul>
                <i>Got Beef?</i> bet objects behave as escrows (they hold player funds) and they also provide a voting mechanism.
            </div>}

            <span className='section-title' onClick={() => toggleSection('section-where-addr')}>{showWhereAddr?'-':'+'} <span>Where do the addresses come from?</span></span>
            {showWhereAddr && <div className='section-body' id='section-where-addr'>
                From your own wallet, and from the wallets of the other participants.
            </div>}
        </div>
    </React.Fragment>;
}
