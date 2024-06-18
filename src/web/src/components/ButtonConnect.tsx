import { useState } from 'react';
import { ConnectModal, useWalletKit } from '@mysten/wallet-kit';

export function ButtonConnect()
{
    const [showConnectModal, setShowConnectModal] = useState(false);
    const { currentAccount, disconnect } = useWalletKit();

    const ButtonDisconnect = () => {
        return <button type='button' className='nes-btn' onClick={disconnect}>
            DISCONNECT
        </button>;
    }

    const ButtonConnect = () => {
        if (currentAccount) {
            return <ButtonDisconnect />;
        }

        return <>
            <ConnectModal
                open={showConnectModal}
                onClose={() => setShowConnectModal(false)}
            />
            <button type='button' className='nes-btn is-warning'
                onClick={() => setShowConnectModal(true)}>CONNECT</button>
        </>;
    };

    return <ButtonConnect />;
}
