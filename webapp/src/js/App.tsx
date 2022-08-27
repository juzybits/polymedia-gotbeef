import React from 'react';
import { Link } from 'react-router-dom';
import { Outlet, Link } from 'react-router-dom';

export function App(props) {
    return <React.Fragment>
        <h1>App</h1>
        <div>
            <ul>
                <li><Link to='/'>Home</Link></li>
                <li><Link to='/new'>New</Link></li>
                <li><Link to='/search'>Search</Link></li>
            </ul>
        </div>
        <div>
            <Outlet />
        </div>
    </React.Fragment>;
}
