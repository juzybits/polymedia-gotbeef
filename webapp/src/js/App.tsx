import React, { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';

import { ButtonConnect } from './components/ButtonConnect';

export function App(props)
{
    const [connected, setConnected] = useState(false);

    return <div id='page'>

        <div id='header'>
            <h1 id='title'>GOT BEEF?</h1>
            <nav id='nav'>
                <Link to='/'>HOME</Link>
                &nbsp;~ <Link to='/new'>NEW</Link>
                &nbsp;~ <Link to='/find'>FIND</Link>
                &nbsp;~ <ButtonConnect connected={connected} setConnected={setConnected} />
            </nav>
        </div>

        <div id='content'>
            <Outlet context={[connected, setConnected]} />
        </div>

    </div>;
}
