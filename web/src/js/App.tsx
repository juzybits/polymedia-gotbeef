import { useEffect, useState, useMemo } from 'react';
import { Outlet, Link } from 'react-router-dom';

import { WalletProvider } from '@mysten/wallet-adapter-react';
import { WalletStandardAdapterProvider } from '@mysten/wallet-adapter-all-wallets';

import { reloadClouds } from './lib/clouds';
import cowImage from '../img/cow256.png';

export function App()
{
    useEffect(() => {
        const resizeObserver = new ResizeObserver((_entries) => {
            reloadClouds();
        });
        resizeObserver.observe(document.getElementById('app') as Element);
    }, []);

    // Return either 'devnet' or 'testnet'
    const getNetwork = (): string => {
        // TODO: remove this in a few days
        const loc = window.location;
        if (loc.hostname == 'testnet.gotbeef.pages.dev') {
            loc.replace('https://gotbeef.app' + loc.pathname + '?network=testnet');
        }
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

    // NOTE: getNetwork and toggleNetwork are duplicated in polymedia-chat/web/src/js/App.tsx

    const walletAdapters = useMemo(() => [new WalletStandardAdapterProvider()], []);

    return <div id='page'>
    <div id='network-widget'>
        <a className='switch-btn' onClick={toggleNetwork}>{network}</a>
    </div>
    <section id='main'>

        <header id='header'>

            <h1 id='title'>GOT BEEF?<img id='cow' src={cowImage} alt='got beef?' onClick={reloadClouds} /></h1>

            <nav id='nav'>
                <Link to='/'>HOME</Link>
                &nbsp;~ <Link to='/new'>NEW</Link>
                &nbsp;~ <Link to='/find'>FIND</Link>
                &nbsp;~ <a href={'https://chat.polymedia.app/@sui-fans?network='+network} target='_blank'>CHAT<sup style={{color: 'deeppink', fontSize: '0.6em', top: '-1em'}}>NEW!</sup></a>
            </nav>

        </header>

        <section id='content'>
        <WalletProvider adapters={walletAdapters}>
            <Outlet context={[network]} />
        </WalletProvider>
        </section>

    </section>

    <footer id='footer'>
        {/* TODO: add version */}
        <div id='footer-links'>
            <a href='https://github.com/juzybits/gotbeef' target='_blank' aria-label='GitHub'><i className='icon icon-github'></i></a>
            <a href='https://twitter.com/polymedia_app' target='_blank' aria-label='Twitter'><i className='icon icon-twitter'></i></a>
            <a href='https://discord.gg/3ZaE69Eq78' target='_blank' aria-label='Discord'><i className='icon icon-discord'></i></a>
        </div>

        <div id='footer-signature'>
            <a href='https://polymedia.app/' target='_blank'>built with <i className='nes-icon heart is-small'></i> by <span className='rainbow'>polymedia</span></a>
        </div>
    </footer>

    <span id='secret'>It's really hard to make something beautiful. And it's really worthwhile.</span>

    </div>;
}
