import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export function Home() {
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
                <i>Got Beef?</i> is a dApp to make on-chain bets on the <a href='https://sui.io/' className='rainbow' target='_blank' rel='noopener'>Sui network</a>.
            </p>
            <p>
                Bet objects serve as escrows (hold player funds) and provide a voting mechanism.
            </p>

            <span className='section-title' onClick={() => toggleSection('section-how-to-play')}>{showHowToPlay?'-':'+'} <span>How to play:</span></span>
            {showHowToPlay &&
            <div className='section-body' id='section-how-to-play'>
                <ol>
                    <li>Create a <Link to='/new'>new bet</Link> between two or more players (bet starts in the "funding" phase).</li>
                    <li>Players send and lock their funds in the bet object (bet moves to the "voting" phase).</li>
                    <li>The winner is selected by the judge / quorum of judges, and the funds get transferred to the winner (bet moves to the "settled" phase").</li>
                </ol>
            </div>}

            <span className='section-title' onClick={() => toggleSection('section-what-is-for')}>{showWhatIsFor?'-':'+'} <span>What is this for?</span></span>
            {showWhatIsFor && <div className='section-body' id='section-what-is-for'>
                In <a href='https://twitter.com/GiganticRebirth/status/1503335929976664065' className='rainbow' target='_blank' rel='noopener'>this scenario</a>, <i>Got Beef?</i> could have been used:
                <ul>
                    <li>player 1 = GCR</li>
                    <li>player 2 = Do Kwon</li>
                    <li>judge&nbsp;&nbsp;&nbsp;&nbsp;= Cobie</li>
                </ul>
                <i>Got Beef</i> bets ensures that funds can only be sent to the winner's address (one of the players). This is a lot safer than trusting a human escrow to hold the funds in their own wallet.
            </div>}

            <span className='section-title' onClick={() => toggleSection('section-where-addr')}>{showWhereAddr?'-':'+'} <span>Where do the addresses come from?</span></span>
            {showWhereAddr && <div className='section-body' id='section-where-addr'>
                From your own wallet, and from the wallets of the other participants.
            </div>}
        </div>
    </React.Fragment>;
}
