import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useWallet } from "@mysten/wallet-adapter-react";

export function ButtonConnect(props: any)
{
    const [error, setError]: any[] = useState(null);
    const [showWallets, setShowWallets] = useState(false);

    const { wallets, wallet, connected, select, disconnect, getAccounts, signAndExecuteTransaction } = useWallet();

    const handleShowWallets = () => {
        if (wallets.length==0) {
            const href = 'https://chrome.google.com/webstore/detail/sui-wallet/opcgpfmipidbgpenhmajoajpbobppdil';
            setError(<span>Install the <a href={href} className='rainbow' target='_blank'>Sui wallet</a> to continue</span>);
        } else {
            setShowWallets(true);
        }
    };

    const handleConnect = (walletName: string) => {
        select(walletName);
    };

    const handleDisconnect = () => {
        console.debug('[ButtonConnect] Disconnected');
        disconnect();
    };

    const WalletSelection = () => {
        return <> { wallets.map(wallet =>
            <button type='button' className='nes-btn' key={wallet.name} onClick={() => handleConnect(wallet.name)}>
                <img src={wallet.name=='Sui Wallet' ? 'https://sui.io/favicon.png' : wallet.icon} style={{
                    width: '1.5em',
                    verticalAlign: 'top',
                    marginRight: '0.5em',
                }} />
                {wallet.name}
            </button>)
        } </>;
    }

    const ButtonDisconnect = () => {
        return <button type='button' className='nes-btn' onClick={handleDisconnect}>
            DISCONNECT
        </button>;
    }

    const ButtonConnect = () => {
        if (showWallets)
            return <WalletSelection />;
        else if (connected)
            return <ButtonDisconnect />;
        else
            return <button type='button' className='nes-btn is-warning' onClick={handleShowWallets}>CONNECT</button>;
    };

    return error ? <i style={{fontSize: '0.9em'}}>{error}</i> : <ButtonConnect />;
}
