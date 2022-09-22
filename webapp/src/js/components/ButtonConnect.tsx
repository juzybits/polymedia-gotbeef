import React from 'react';
import { connect, disconnect, isConnected, testSdk, testWalletAdapter } from '../lib/sui_tools';
import { useOutletContext } from 'react-router-dom';

export function ButtonConnect(props)
{
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
        {
            props.connected
            ? <button type='button' className='nes-btn is-success' onClick={onClickDisconnect}>Disconnect</button>
            : <button type='button' className='nes-btn is-warning' onClick={onClickConnect}>Connect</button>
        }
    </React.Fragment>;
}
