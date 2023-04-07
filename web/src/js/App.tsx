import { useEffect, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { WalletKitProvider } from '@mysten/wallet-kit';
import { Connection, JsonRpcProvider } from '@mysten/sui.js';

import { NetworkName, NetworkSelector, loadNetwork, loadRpcConfig } from '@polymedia/webutils';
import { reloadClouds } from './lib/clouds';
import cowImage from '../img/cow256.png';
import imgAppChat from '../img/app-chat.webp';
import imgAppCastle from '../img/app-castle.webp';
import imgAppProfile from '../img/app-profile.webp';

export type AppContext = {
    network: NetworkName,
    rpcProvider: JsonRpcProvider,
};

export function App() {
    const location = useLocation();
    const [network, setNetwork] = useState<NetworkName|null>(null);
    const [rpcProvider, setRpcProvider] = useState<JsonRpcProvider|null>(null);

    useEffect(() => {
        async function initialize() {
            const network = loadNetwork();
            const rpcConfig = await loadRpcConfig({network});
            const rpcProvider = new JsonRpcProvider(new Connection(rpcConfig));
            setNetwork(network);
            setRpcProvider(rpcProvider);
        };
        initialize();
    }, []);

    useEffect(() => {
        const resizeObserver = new ResizeObserver((_entries) => {
            reloadClouds();
        });
        resizeObserver.observe(document.getElementById('app') as Element);
    }, []);

    if (!network || !rpcProvider) {
        return <></>;
    }

    const appContext: AppContext = {
        network,
        rpcProvider,
    };

    return <div id='page'>
    <NetworkSelector currentNetwork={network} />
    <section id='main'>

        <header id='header'>

            <h1 id='title'><span>GOT BEEF?<img id='cow' src={cowImage} alt='got beef?' onClick={reloadClouds} /></span></h1>

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
            <Outlet context={appContext} />
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
                        <a className='nes-btn is-primary' target='_blank' href={'https://profile.polymedia.app?network='+network}>VISIT</a>
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
                        <a className='nes-btn is-primary' target='_blank' href={'https://chat.polymedia.app/@sui-fans?network='+network}>VISIT</a>
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
                        <a className='nes-btn is-primary' target='_blank' href={'https://mountsogol.com?network='+network}>VISIT</a>
                    </div>
                </div>
            </div>
        </div>
    </div>
    }

    </div>;
}
