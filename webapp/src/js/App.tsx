import React, { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';

import { ButtonConnect } from './components/ButtonConnect';
import rockImage from '../img/rock.jpeg';

export function App(props)
{
    const [connected, setConnected] = useState(false);

    return <div id='page'>
    <section id='main'>

        <header>

            <h1 id='title'>GOT BEEF?<img id='rock' src={rockImage} alt='got beef?' /></h1>


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
        <a href='https://twitter.com/juzybits' target='_blank'>built with <i className='nes-icon heart is-small'></i> by <span className='rainbow'>@juzybits</span></a>
    </footer>

    </div>;
}
