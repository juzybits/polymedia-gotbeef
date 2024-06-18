import { useSignTransaction, useSuiClient } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { AppContext } from "./App";
import { showConfetti } from "./lib/confetti";
import { Bet, getConfig, getErrorName } from "./lib/gotbeef";

export const Cancel: React.FC<{
    bet: Bet;
    reloadBet: () => Promise<void>;
    setModal: React.Dispatch<React.SetStateAction<React.ReactNode|null>>;
}> = ({
    bet,
    reloadBet,
    setModal,
}) => {
    const suiClient = useSuiClient();
    const { mutateAsync: signTransaction } = useSignTransaction();

    const { network } = useOutletContext<AppContext>();
    const [ error, setError ] = useState("");

    const { packageId } = getConfig(network);
    const cancelBet = async (
        bet: Bet
    ): ReturnType<typeof suiClient["executeTransactionBlock"]> =>
    {
        console.debug(`[cancelBet] Calling bet::cancel on package: ${packageId}`);

        const tx = new Transaction();
        tx.moveCall({
            target: `${packageId}::bet::cancel`,
            typeArguments: [ bet.collatType ],
            arguments: [
                tx.object(bet.id),
            ],
        });

        const signedTx = await signTransaction({
            transaction: tx,
            chain: `sui:${network}`,
        });
        return suiClient.executeTransactionBlock({
            transactionBlock: signedTx.bytes,
            signature: signedTx.signature,
            options: {
                showEffects: true,
            },
        });
    };

    const onClickCancel = () => {
        cancelBet(bet)
        .then(resp => {
            const effects = resp.effects!;
            if (effects.status.status == "success") {
                showConfetti("🧨");
                setError("");
                setModal("");
                reloadBet();
                console.debug("[onClickCancel] Success:", resp);
            } else {
                setError( getErrorName(effects.status.error) );
            }
        })
        .catch(error => {
            setError( getErrorName(error.message) );
        });
    };

    const onClickBack = () => {
        setModal("");
    };

    return <section className="bet-modal">
        <h2>Cancel bet</h2>
        The bet can be canceled because nobody has funded it yet.
        <br/>
        <br/>
        <button type="button" className="nes-btn is-error" onClick={onClickCancel}>
            CANCEL
        </button>
        &nbsp;
        <button type="button" className="nes-btn" onClick={onClickBack}>
            BACK
        </button>
        <br/>

        {error &&
        <React.Fragment>
            <br/>
            ERROR:
            <br/>
            {error}
            <br/>
        </React.Fragment>}
        <br/>
        <hr/>
    </section>;
};
