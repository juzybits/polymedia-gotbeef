import { ConnectModal, useCurrentAccount, useDisconnectWallet } from "@mysten/dapp-kit";
import { useState } from "react";

export function ButtonConnect()
{
    const currentAccount = useCurrentAccount();
    const { mutate: disconnect } = useDisconnectWallet();

    const [showConnectModal, setShowConnectModal] = useState(false);

    const ButtonDisconnect = () => {
        return <button type="button" className="nes-btn" onClick={() => { disconnect(); }}>
            DISCONNECT
        </button>;
    };

    const ButtonConnect = () => {
        if (currentAccount) {
            return <ButtonDisconnect />;
        }

        return <>
            <ConnectModal
                trigger={<></>}
                open={showConnectModal}
                onOpenChange={isOpen => { setShowConnectModal(isOpen); }}
            />
            <button type="button" className="nes-btn is-warning"
                onClick={() => setShowConnectModal(true)}>CONNECT</button>
        </>;
    };

    return <ButtonConnect />;
}
