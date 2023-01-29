import { useState } from 'react';
import { useWallet } from "@mysten/wallet-adapter-react";

export function ButtonConnect()
{
    const [error, setError]: any[] = useState(null);
    const [showWallets, setShowWallets] = useState(false);

    const { wallets, connected, select, disconnect } = useWallet();

    const handleShowWallets = () => {
        if (wallets.length==0) {
            const linkSui = 'https://chrome.google.com/webstore/detail/sui-wallet/opcgpfmipidbgpenhmajoajpbobppdil';
            const linkEthos = 'https://chrome.google.com/webstore/detail/ethos-sui-wallet/mcbigmjiafegjnnogedioegffbooigli';
            const linkSuiet = 'https://chrome.google.com/webstore/detail/suiet-sui-wallet/khpkpbbcccdmmclmpigdgddabeilkdpd';
            setError(<div style={{textAlign: 'left', fontSize: '0.9em', fontStyle: 'italic'}}>
                <p>Please install a wallet to continue:</p>
                <ul style={{margin: '0'}}>
                <li><a href={linkSui} className='rainbow' target='_blank'>Sui Wallet</a> (official)</li>
                <li><a href={linkEthos} className='rainbow' target='_blank'>Ethos Wallet</a></li>
                <li><a href={linkSuiet} className='rainbow' target='_blank'>Suiet Wallet</a></li>
                </ul>
            </div>);
        } else {
            setShowWallets(true);
        }
    };

    const handleConnect = (walletName: string) => {
        select(walletName);
        console.debug('[ButtonConnect] Connecting to', walletName);
        setShowWallets(false);
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

    return error ? <>{error}</> : <ButtonConnect />;
}
