import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useWallet } from "@mysten/wallet-adapter-react";

export function ButtonConnect(props: any)
{
    const [error, setError]: any[] = useState(null);
    const [showWallets, setShowWallets] = useState(false);

    const { wallets, wallet, connected, select, disconnect, getAccounts, signAndExecuteTransaction } = useWallet();

    const handleConnect = (walletName: string) => {
        select(walletName)
        .then(result => {
            console.debug('[ButtonConnect] Connected to', walletName);
            setShowWallets(false);
        })
        .catch(error => {
            console.warn('[ButtonConnect] Connection failure: ', error.message);
            setError(<span>Connection failure</span>);
        });
    };

    const handleDisconnect = () => {
        console.debug('[ButtonConnect] Disconnected');
        disconnect();
    };

    const WalletSelection = () => {
        return <div id='wallet-selection'>
        {wallets.map(wallet =>
            <button type='button' className='nes-btn' key={wallet.name} onClick={() => handleConnect(wallet.name)}>
                <img src={wallet.name=='Sui Wallet' ? 'https://sui.io/favicon.png' : wallet.icon} style={{
                    width: '1.5em',
                    verticalAlign: 'top',
                    marginRight: '0.5em',
                }} />
                {wallet.name}
            </button>
            )}
        </div>;
    }

    const ButtonDisconnect = () => {
        return <button type='button' className='nes-btn' onClick={handleDisconnect}>
            LOG OUT
        </button>;
    }

    const ButtonConnect = () => {
        if (showWallets)
            return <WalletSelection />;
        else if (connected)
            return <ButtonDisconnect />;
        else
            return <button type='button' className='nes-btn is-warning' onClick={()=>setShowWallets(true)}>CONNECT</button>;
    };

    return error ? <i style={{fontSize: '0.9em'}}>{error}</i> : <ButtonConnect />;
}
