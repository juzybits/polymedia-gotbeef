import React, { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';

import { ButtonConnect } from './components/ButtonConnect';

export function App(props)
{
    const [connected, setConnected] = useState(false);

    return <div id='page'>
    <section id='main'>

        <header>

            <h1 id='title'>GOT BEEF?</h1>

            <nav id='nav'>
                <Link to='/'>HOME</Link>
                &nbsp;~ <Link to='/new'>NEW</Link>
                &nbsp;~ <Link to='/find'>FIND</Link>
            </nav>

        </header>

        <section id='content'>
            <Outlet context={[connected, setConnected]} />
        </section>

    </section>

    <footer>
        built with <i className='nes-icon heart is-small'></i> by <a href='https://twitter.com/juzybits' className='rainbow' target='_blank'>@juzybits</a>
    </footer>

    </div>;
}
