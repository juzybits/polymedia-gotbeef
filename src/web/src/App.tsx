import {
    SuiClientProvider,
    WalletProvider,
    createNetworkConfig
} from "@mysten/dapp-kit";
import "@mysten/dapp-kit/dist/index.css";
import { getFullnodeUrl } from "@mysten/sui/client";
import { NetworkSelector, isLocalhost, loadNetwork } from "@polymedia/suitcase-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { BrowserRouter, Link, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { Find } from "./Find";
import { Home } from "./Home";
import { New } from "./New";
import { NotFound } from "./NotFound";
import { View } from "./View";
import "./css/styles.less";
import { reloadClouds } from './lib/clouds';

/* App router */

export const AppRouter: React.FC = () => {
    return (
    <BrowserRouter>
        <Routes>
            <Route path="/" element={<AppSuiProviders />} >
                <Route index element={<Home />} />
                <Route path='new' element={<New />} />
                <Route path='find' element={<Find />} />
                <Route path='bet/:uid' element={<View />} />
                <Route path='*' element={<NotFound />} />
            </Route>
        </Routes>
    </BrowserRouter>
    );
};

/* Sui providers + network config */

export const supportedNetworks = ["mainnet", "testnet", "devnet"] as const;
export type NetworkName = typeof supportedNetworks[number];

const { networkConfig } = createNetworkConfig({
    mainnet: { url: getFullnodeUrl("mainnet") },
    testnet: { url: getFullnodeUrl("testnet") },
    devnet: { url: getFullnodeUrl("devnet") },
});

const queryClient = new QueryClient();
const AppSuiProviders: React.FC = () => {
    const [ network ] = useState(loadNetwork(supportedNetworks, "mainnet"));
    return (
    <QueryClientProvider client={queryClient}>
        <SuiClientProvider networks={networkConfig} network={network}>
            <WalletProvider autoConnect={true}>
                <App network={network} />
            </WalletProvider>
        </SuiClientProvider>
    </QueryClientProvider>
    );
};

/* App */

export type ReactSetter<T> = React.Dispatch<React.SetStateAction<T>>;

export type AppContext = {
    network: NetworkName;
};

const App: React.FC<{
    network: NetworkName;
}> = ({
    network,
}) =>
{
    const location = useLocation();
    const showNetworkSelector = isLocalhost();

    useEffect(() => {
        const resizeObserver = new ResizeObserver((_entries) => {
            reloadClouds();
        });
        resizeObserver.observe(document.getElementById('app') as Element);
    }, []);

    const appContext: AppContext = {
        network,
    };

    return <div id='page'>
    {showNetworkSelector &&
    <NetworkSelector currentNetwork={network} supportedNetworks={supportedNetworks} />
    }
    <section id='main'>

        <header id='header'>

            <h1 id='title'><span>GOT BEEF?<img id='cow' src="/img/cow256.png" alt='got beef?' onClick={reloadClouds} /></span></h1>

            <nav id='nav'>
                <Link to='/'>HOME</Link>
                &nbsp;~ <Link to='/new'>NEW</Link>
                &nbsp;~ <Link to='/find'>FIND</Link>
                {/*&nbsp;~ <a href={'https://chat.polymedia.app/@sui-fans?network='+network} target='_blank' rel='noopener'>CHAT</a>*/}
                {/*&nbsp;~ <a href={'https://chat.polymedia.app/@sui-fans'} target='_blank' rel='noopener'>CHAT</a>*/}
            </nav>

        </header>

        <section id='content'>
            <Outlet context={appContext} />
        </section>

    </section>

    <footer id='footer'>
        <div id='footer-links'>
            <a href='https://github.com/juzybits/gotbeef' target='_blank' rel='noopener' aria-label='GitHub'><i className='icon icon-github'></i></a>
            <a href='https://twitter.com/polymedia_app' target='_blank' rel='noopener' aria-label='Twitter'><i className='icon icon-twitter'></i></a>
            <a href='https://discord.gg/3ZaE69Eq78' target='_blank' rel='noopener' aria-label='Discord'><i className='icon icon-discord'></i></a>
        </div>

        <div id='footer-signature'>
            <a href='https://polymedia.app/' target='_blank' rel='noopener'>built with <i className='nes-icon heart is-small'></i> by <span className='rainbow'>Polymedia</span></a>
        </div>
    </footer>

    {location.pathname==='/'
    &&
    <div id='more-from-us'>
        <h2>More from us</h2>
        <div id='apps-showcase'>
            <div className='app'>
                <div className='app-photo'>
                    <img src="/img/app-profile.webp" />
                </div>
                <div className='app-details'>
                    <h3 className='app-title'>Polymedia Profile</h3>
                    <p className='app-description'>Onchain identity system used in all our apps.</p>
                    <div className='app-btn-wrap'>
                        <a className='nes-btn is-primary' target='_blank' rel='noopener' href={'https://profile.polymedia.app?network='+network}>VISIT</a>
                    </div>
                </div>
            </div>
            <div className='app'>
                <div className='app-photo'>
                    <img src="/img/app-chat.webp" />
                </div>
                <div className='app-details'>
                    <h3 className='app-title'>Polymedia Chat</h3>
                    <p className='app-description'>Unstoppable chat rooms, fully on-chain.</p>
                    <div className='app-btn-wrap'>
                        <a className='nes-btn is-primary' target='_blank' rel='noopener' href={'https://chat.polymedia.app/@sui-fans?network='+network}>VISIT</a>
                    </div>
                </div>
            </div>
            <div className='app'>
                <div className='app-photo'>
                    <img src="/app-castle.webp" />
                </div>
                <div className='app-details'>
                    <h3 className='app-title'>Journey to Mount Sogol</h3>
                    <p className='app-description'>The door to The Invisible must be visible...</p>
                    <div className='app-btn-wrap'>
                        <a className='nes-btn is-primary' target='_blank' rel='noopener' href={'https://journey.polymedia.app?network='+network}>VISIT</a>
                    </div>
                </div>
            </div>
        </div>
    </div>
    }

    </div>;
}
