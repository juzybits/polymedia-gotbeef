import React from 'react';
import { Link } from 'react-router-dom';
import { Outlet, Link } from 'react-router-dom';

export function App(props) {
    return (

    <div id='page'>

        <div id='header'>
            <h1 id='title'>GOT BEEF?</h1>
            <nav id='nav'>
                <Link to='/'>HOME</Link>
                &nbsp;~ <Link to='/new'>NEW</Link>
                &nbsp;~ <Link to='/find'>FIND</Link>
            </nav>
        </div>

        <div id='content'>
            <Outlet />
        </div>

    </div>

    );
}
