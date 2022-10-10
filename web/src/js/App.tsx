import React, { useEffect, useState } from 'react';
import { Outlet, Link } from 'react-router-dom';

import { ButtonConnect } from './components/ButtonConnect';
import { reloadClouds } from './lib/clouds';
import cowImage from '../img/cow256.png';

export function App(props)
{
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        const resizeObserver = new ResizeObserver((entries) => {
            reloadClouds();
        });
        resizeObserver.observe(document.getElementById('app'));
    }, []);

    return <div id='page'>
    <section id='main'>

        <header id='header'>

            <h1 id='title'>GOT BEEF?<img id='cow' src={cowImage} alt='got beef?' onClick={reloadClouds} /></h1>

            <nav id='nav'>
                <Link to='/'>HOME</Link>
                &nbsp;~ <Link to='/new'>NEW</Link>
                &nbsp;~ <Link to='/find'>FIND</Link>
                {/* TODO: History page */}
            </nav>

        </header>

        <section id='content'>
            <Outlet context={[connected, setConnected]} />
        </section>

    </section>

    <footer id='footer'>
        {/* TODO: add version */}
        <div id='footer-links'>
            <a href='https://github.com/juzybits/gotbeef' target='_blank' aria-label='GitHub'><i className='icon icon-github'></i></a>
            <a href='https://twitter.com/juzybits' target='_blank' aria-label='Twitter'><i className='icon icon-twitter'></i></a>
            <a href='https://discord.gg/BVaq7S9C4A' target='_blank' aria-label='Discord'><i className='icon icon-discord'></i></a>
        </div>

        <div id='footer-signature'>
            <a href='https://twitter.com/juzybits' target='_blank'>built with <i className='nes-icon heart is-small'></i> by <span className='rainbow'>@juzybits</span></a>
        </div>
    </footer>

    <span id='secret'>It's really hard to make something beautiful. And it's really worthwhile.</span>

    </div>;
}
