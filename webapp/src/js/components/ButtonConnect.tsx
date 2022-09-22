import React from 'react';
import { connect, disconnect, isConnected, testSdk, testWalletAdapter } from '../lib/sui_tools';
import { useOutletContext } from 'react-router-dom';

export function ButtonConnect(props) {
    let color = props.connected ? 'deepskyblue' : 'red';
    const onClickConnect = async () => {
        await connect();
        props.setConnected( isConnected() );
        if ( isConnected() ) {
            console.debug("[ButtonConnect] Connected.");
        } else {
            console.warn("[ButtonConnect] Failed to connect.");
        }
    };
    const onClickDisconnect = () => {
        disconnect();
        props.setConnected(false);
        console.debug("[ButtonConnect] Disconnected.");
    };
    return <React.Fragment>
        <label style={{'color': color}}>CONNECT</label>
        <br/>
        <button onClick={onClickConnect} type='button' disabled={props.connected}>Connect</button>
        <br/>
        <button onClick={onClickDisconnect} type='button' disabled={!props.connected}>Disconnect</button>
        <br/>
        <button onClick={testSdk} type='button'>Test SDK</button>
        <br/>
        <button onClick={testWalletAdapter} type='button'>Test wallet adapter</button>
    </React.Fragment>;
}
