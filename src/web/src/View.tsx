import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { PolymediaProfile, ProfileClient } from '@polymedia/profile-sdk';
import { shortenSuiAddress } from '@polymedia/suitcase-core';
import { LinkToPolymedia } from '@polymedia/suitcase-react';
import React, { useEffect, useRef, useState } from 'react';
import { useOutletContext, useParams } from 'react-router-dom';
import { AppContext } from './App';
import { Cancel } from './Cancel';
import { Fund } from './Fund';
import { Vote } from './Vote';
import { ButtonConnect } from './components/ButtonConnect';
import { Bet, getBet } from './lib/gotbeef';

export function View()
{
    /* Data */

    const suiClient = useSuiClient();
    const currentAccount = useCurrentAccount();

    const { network } = useOutletContext<AppContext>();

    const betId = useParams().uid || '';
    const [bet, setBet] = useState<Bet|null|undefined>(undefined);
    const [modal, setModal] = useState<React.ReactNode|null>(null);
    const [isPlayer, setIsPlayer] = useState(false);
    const [isJudge, setIsJudge] = useState(false);
    const [userCanFund, setUserCanFund] = useState(false);
    const [userCanVote, setUserCanVote] = useState(false);
    const [userCanCancel, setUserCanCancel] = useState(false);

    const [profileClient] = useState( new ProfileClient(network, suiClient) ); // TODO: move to App.tsx to benefit from internal cache
    const [profiles, setProfiles] = useState( new Map<string, PolymediaProfile|null>() );

    const refIsReloadInProgress = useRef(false);

    const fetchProfiles = (bet: Bet) => { // TODO: do only once
        const lookupAddresses = [ ...bet.players, ...bet.judges ];
        profileClient.getProfilesByOwner(lookupAddresses)
        .then(profiles => {
            setProfiles(profiles);
        })
        .catch(error => {
            console.warn('[fetchProfiles]', error.stack);
        })
    };
    const AddressOrProfile: React.FC<{address: string}> = ({address}) => {
        const profile = profiles.get(address);
        const shortAddr = shortenSuiAddress(address);
        return <>{profile
            ? <>{profile.name} ({shortAddr})</>
            : shortAddr
        }</>;
    };

    /* Load bet object data */

    const reloadBet = async () => {
        if (refIsReloadInProgress.current) {
            return;
        }
        refIsReloadInProgress.current = true;
        await getBet(network, suiClient, betId).then( (bet: Bet|null) => {
            setBet(bet);
            bet && fetchProfiles(bet);
        });
        refIsReloadInProgress.current = false;
    };

    useEffect(() => {
        document.title = `Got Beef? - View: ${betId}`;
        reloadBet();
        // Periodically fetch the bet in case other participants made changes
        const interval = setInterval(reloadBet, 5000);
        return () => {
            clearInterval(interval);
        };
        // if (location.state && location.state.bet) {
        //     // Reuse the bet object data that Find.tsx has already fetched
        //     setBet(location.state.bet);
        // } else {
        //     // The user came directly to this URL, fetch bet object from Sui
        //     reloadBet();
        // }
    }, []);

    /* Decide which action buttons are visible to the user */

    const { isConnected } = useWalletKit();
    useEffect(() => {
        if (!isConnected || !bet || !currentAccount) {
            return;
        }
        const userAddr = currentAccount.address;
        const isJudge = bet.judges.includes(userAddr);
        const isPlayer = bet.players.includes(userAddr);
        setIsPlayer(isPlayer);
        setIsJudge(isJudge);
        setUserCanFund( isPlayer && bet.phase == 'funding' && !bet.funds.has(userAddr) );
        setUserCanVote( isJudge && bet.phase == 'voting' && !bet.votesByJudge.has(userAddr) );
        setUserCanCancel( (isPlayer||isJudge) && bet.phase == 'funding' && bet.funds.size == 0 );
    }, [isConnected, bet, currentAccount]);

    /* Render */

    if (typeof bet === 'undefined')
        return <React.Fragment>Loading...</React.Fragment>;

    if (bet === null)
        return <React.Fragment>Bet not found.</React.Fragment>;

    // MAYBE: show date of last update
    const showFunded = ['funding'].includes(bet.phase);
    return <React.Fragment>
    {
        modal ||
        // Show action only if we're not inside of a modal (fund/vote/cancel)
        (
            // Show actions only if the bet is not already settled/canceled/stalemate
            (bet.phase=='voting' || bet.phase=='funding') &&
            <section id='bet-actions-container' className='nes-container with-title'>
                <h3 className='title'>Actions</h3>
                <div id='bet-actions' className='button-container'>
                {isConnected && <>
                    {userCanFund &&
                    <button type='button' className='nes-btn is-success'
                        onClick={() => setModal(<Fund bet={bet} reloadBet={reloadBet} setModal={setModal} />)}>
                        FUND
                    </button>}

                    {userCanVote &&
                    <button type='button' className='nes-btn is-success'
                        onClick={() => setModal(<Vote bet={bet} profiles={profiles} reloadBet={reloadBet} setModal={setModal} />)}>
                        VOTE
                    </button>}

                    {userCanCancel &&
                    <button type='button' className='nes-btn is-error'
                        onClick={() => setModal(<Cancel bet={bet} reloadBet={reloadBet} setModal={setModal} />)}>
                        CANCEL
                    </button>}

                    {
                        (isPlayer===false && isJudge===false)
                        ? <span className='error'>
                            Your address is not a participant in this bet
                        </span>
                        : (userCanFund===false && userCanVote===false && userCanCancel===false) &&
                        <span className='error'>
                            No actions available at this time
                        </span>
                    }
                </>}
                    <ButtonConnect />
                </div>
            </section>
        )
    }

    <h2 style={{marginBottom: '0.8em'}}>{bet.title}</h2>

    <table id='bet-summary'>
        <tbody>
            <tr>
                <td>ID:</td>
                <td>
                    <LinkToPolymedia network={network} kind='object' addr={betId} className='rainbow' />
                </td>
            </tr>
            {
            !bet.winner ? '' :
            <tr>
                <td>&nbsp;<i className='nes-icon trophy is-small' />:</td>
                <td>{shortenSuiAddress(bet.winner)}</td>
            </tr>
            }
            <tr>
                <td>Phase:</td>
                <td><span style={{color: phaseColor(bet.phase)}}>{bet.phase}</span></td>
            </tr>
            <tr>
                <td>Size:</td>
                <td>{bet.size/1_000_000_000} <i className='nes-icon coin is-small' /> {bet.collatType}</td>
            </tr>
            <tr>
                <td>Quorum:</td>
                <td>{bet.quorum}/{bet.judges.length}</td>
            </tr>
            {
            !bet.description ? '' :
            <tr>
                <td>Details:</td>
                <td>{bet.description}</td>
            </tr>
            }
        </tbody>
    </table>

    <table>
        <thead>
            <tr>
                <th><i className='snes-jp-logo custom-logo' /> Player</th>
                {!showFunded && <th>Votes</th>}
                {showFunded && <th>Funded</th>}
            </tr>
        </thead>
        <tbody>
        {
            bet.players.map(player_addr =>
            <React.Fragment key={player_addr}>
                <tr>
                    <td><AddressOrProfile address={player_addr} /></td>
                    {!showFunded && <td>{bet.votesByPlayer.get(player_addr) || '0'}</td>}
                    {showFunded && <td>{bet.funds.get(player_addr) ? 'Yes' : 'No'}</td>}
                </tr>
            </React.Fragment>)
        }
        </tbody>
    </table>

    <table>
        <thead>
            <tr>
                <th><i className='nes-logo custom-logo' /> Judge</th>
                <th>Vote</th>
            </tr>
        </thead>
        <tbody>
        {
            bet.judges.map(judge_addr =>
            <React.Fragment key={judge_addr}>
            <tr>
                <td><AddressOrProfile address={judge_addr} /></td>
                <td>{shortenSuiAddress(bet.votesByJudge.get(judge_addr))}</td>
            </tr>
            </React.Fragment>)
        }
        </tbody>
    </table>

    <br/>
    <h3>PLAYER ANSWERS</h3>

    <table>
        <thead>
            <tr>
                <th><i className='snes-jp-logo custom-logo' /> Player</th>
                <th>Answer</th>
            </tr>
        </thead>
        <tbody>
        {
            bet.players.map(player_addr =>
            <React.Fragment key={player_addr}>
                <tr>
                    <td><AddressOrProfile address={player_addr} /></td>
                    <td>{bet.answers.get(player_addr) || '-'}</td>
                </tr>
            </React.Fragment>)
        }
        </tbody>
    </table>

    </React.Fragment>;
}

const phaseColors = new Map([
    ['funding', '#92cc41'],
    ['voting', '#92cc41'],
    ['settled', 'grey'],
    ['canceled', '#e76e55'],
    ['stalemate', '#e76e55'],
]);

function phaseColor(phaseName: string): string {
    return phaseColors.get(phaseName) || 'black';
}
