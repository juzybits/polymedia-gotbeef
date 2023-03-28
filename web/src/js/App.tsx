import { useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';

import { WalletKitProvider } from '@mysten/wallet-kit';

import { reloadClouds } from './lib/clouds';
import cowImage from '../img/cow256.png';
import imgAppChat from '../img/app-chat.webp';
import imgAppCastle from '../img/app-castle.webp';
import imgAppProfile from '../img/app-profile.webp';

export function App()
{
    useEffect(() => {
        const resizeObserver = new ResizeObserver((_entries) => {
            reloadClouds();
        });
        resizeObserver.observe(document.getElementById('app') as Element);
    }, []);

    const network = 'devnet';
    // Delete query string
    window.history.replaceState({}, document.title, window.location.pathname);
    /*
    // NOTE: getNetwork() and toggleNetwork() are duplicated in other Polymedia projects

    // Return either 'devnet' or 'testnet'
    const getNetwork = (): string => {
        // Read 'network' URL parameter
        const params = new URLSearchParams(window.location.search);
        // Delete query string
        window.history.replaceState({}, document.title, window.location.pathname);
        let newNetwork = params.get('network');
        if (newNetwork === 'devnet' || newNetwork === 'testnet') {
            // Update localStorage
            localStorage.setItem('polymedia.network', newNetwork);
            return newNetwork;
        } else {
            return localStorage.getItem('polymedia.network') || 'devnet';
        }
    };

    const [network, setNetwork] = useState( getNetwork() );

    const toggleNetwork = () => {
        const newNetwork = network==='devnet' ? 'testnet' : 'devnet';
        setNetwork(newNetwork);
        localStorage.setItem('polymedia.network', newNetwork);
        window.location.reload();
    };
    */

    const location = useLocation();

    return <div id='page'>
    {/*<div id='network-widget'>
        <a className='switch-btn' onClick={toggleNetwork}>{network}</a>
    </div>*/}
    <section id='main'>

        <header id='header'>

            <h1 id='title'>GOT BEEF?<img id='cow' src={cowImage} alt='got beef?' onClick={reloadClouds} /></h1>

            <nav id='nav'>
                <Link to='/'>HOME</Link>
                &nbsp;~ <Link to='/new'>NEW</Link>
                &nbsp;~ <Link to='/find'>FIND</Link>
                {/*&nbsp;~ <a href={'https://chat.polymedia.app/@sui-fans?network='+network} target='_blank'>CHAT</a>*/}
                {/*&nbsp;~ <a href={'https://chat.polymedia.app/@sui-fans'} target='_blank'>CHAT</a>*/}
            </nav>

        </header>

        <section id='content'>
        <WalletKitProvider>
            <Outlet context={[network]} />
        </WalletKitProvider>
        </section>

    </section>

    <footer id='footer'>
        <div id='footer-links'>
            <a href='https://github.com/juzybits/gotbeef' target='_blank' aria-label='GitHub'><i className='icon icon-github'></i></a>
            <a href='https://twitter.com/polymedia_app' target='_blank' aria-label='Twitter'><i className='icon icon-twitter'></i></a>
            <a href='https://discord.gg/3ZaE69Eq78' target='_blank' aria-label='Discord'><i className='icon icon-discord'></i></a>
        </div>

        <div id='footer-signature'>
            <a href='https://polymedia.app/' target='_blank'>built with <i className='nes-icon heart is-small'></i> by <span className='rainbow'>polymedia</span></a>
        </div>
    </footer>

    {location.pathname==='/'
    &&
    <div id='more-from-us'>
        <h2>More from us</h2>
        <div id='apps-showcase'>
            <div className='app'>
                <div className='app-photo'>
                    <img src={imgAppProfile} />
                </div>
                <div className='app-details'>
                    <h3 className='app-title'>Polymedia Profile</h3>
                    <p className='app-description'>Onchain identity system used in all our apps.</p>
                    <div className='app-btn-wrap'>
                        <a className='nes-btn is-primary' target='_blank' href='https://profile.polymedia.app'>VISIT</a>
                    </div>
                </div>
            </div>
            <div className='app'>
                <div className='app-photo'>
                    <img src={imgAppChat} />
                </div>
                <div className='app-details'>
                    <h3 className='app-title'>Polymedia Chat</h3>
                    <p className='app-description'>Unstoppable chat rooms, fully on-chain.</p>
                    <div className='app-btn-wrap'>
                        <a className='nes-btn is-primary' target='_blank' href='https://chat.polymedia.app/@sui-fans'>VISIT</a>
                    </div>
                </div>
            </div>
            <div className='app'>
                <div className='app-photo'>
                    <img src={imgAppCastle} />
                </div>
                <div className='app-details'>
                    <h3 className='app-title'>Journey to Mount Sogol</h3>
                    <p className='app-description'>The door to The Invisible must be visible...</p>
                    <div className='app-btn-wrap'>
                        <a className='nes-btn is-primary' target='_blank' href='https://mountsogol.com'>VISIT</a>
                    </div>
                </div>
            </div>
        </div>
    </div>
    }

    <span id='secret'>It's really hard to make something beautiful. And it's really worthwhile.</span>

    </div>;
}
