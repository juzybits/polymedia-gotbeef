import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';

import { connect, disconnect, isConnected, isInstalled } from '../lib/sui_tools';

export function ButtonConnect(props: any)
{
    const [error, setError] = useState(undefined);

    const onClickConnect = async () => {
        // Is the Sui Wallet browser extension installed?
        if (!isInstalled) {
            const href = 'https://chrome.google.com/webstore/detail/sui-wallet/opcgpfmipidbgpenhmajoajpbobppdil';
            setError(<span>Install the <a href={href} className='rainbow' target='_blank'>Sui wallet</a> to continue</span>);
            return;
        }

        await connect();
        props.setConnected( isConnected() );

        if ( isConnected() ) {
            console.debug('[ButtonConnect] Connected');
        } else {
            console.warn('[ButtonConnect] Connection failure');
            setError(<span>Connection failure</span>);
        }
    };

    const onClickDisconnect = () => {
        disconnect();
        props.setConnected(false);
        console.debug('[ButtonConnect] Disconnected.');
    };

    const ButtonConnect = () => {
        return props.connected
            ? <button type='button' className='nes-btn is-success' onClick={onClickDisconnect}>Disconnect</button>
            : <button type='button' className='nes-btn is-warning' onClick={onClickConnect}>Connect</button>;
    };

    return error ? <i style={{fontSize: '0.9em'}}>{error}</i> : <ButtonConnect />;
}
