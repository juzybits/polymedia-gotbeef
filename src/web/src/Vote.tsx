import { Transaction } from "@mysten/sui/transactions";
import { PolymediaProfile } from "@polymedia/profile-sdk";
import React, { SyntheticEvent, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { AppContext } from "./App";
import { showConfetti } from "./lib/confetti";
import { Bet, getConfig, getErrorName } from "./lib/gotbeef";
import { useSignTransaction, useSuiClient } from "@mysten/dapp-kit";

export const Vote: React.FC<{
    bet: Bet;
    reloadBet: () => Promise<void>;
    setModal: React.Dispatch<React.SetStateAction<React.ReactNode|null>>;
    profiles: Map<string, PolymediaProfile|null>;
}> = ({
    bet,
    reloadBet,
    setModal,
    profiles,

}) => {

    const suiClient = useSuiClient();
    const { mutateAsync: signTransaction } = useSignTransaction();

    const { network } = useOutletContext<AppContext>();
    const { packageId } = getConfig(network);

    const [error, setError] = useState("");

    const castVote = async (
        bet: Bet,
        player_addr: string
    ): ReturnType<typeof suiClient["executeTransactionBlock"]> =>
    {
        console.debug(`[castVote] Calling bet::vote on package: ${packageId}`);

        const tx = new Transaction();
        tx.moveCall({
            target: `${packageId}::bet::vote`,
            typeArguments: [ bet.collatType ],
            arguments: [
                tx.object(bet.id),
                tx.pure.address(player_addr),
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

    const onClickVote = (e: SyntheticEvent) => {
        const player_addr = (e.target as HTMLButtonElement).value;
        castVote(bet, player_addr)
        .then(resp => {
            const effects = resp.effects!;
            if (effects.status.status == "success") {
                showConfetti();
                setError("");
                setModal("");
                reloadBet();
                console.debug("[onClickVote] Success:", resp);
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

    const profileNameOrBlank = (address: string): string => {
        const profile = profiles.get(address);
        return profile ? profile.name : "";
    };

    return <section className="bet-modal">
        <h2>Vote</h2>
        Click the address of the winner:
        <br/>
        {
            bet.players.map((player: string) =>
                <div key={player} className="player-box">
                    <div>{profileNameOrBlank(player)}</div>
                    <button type="button" className="nes-btn is-primary" style={{overflowWrap: "anywhere"}}
                        value={player} onClick={onClickVote}>{player}
                    </button>
                    <span className="player-box-answer">
                        <b>ANSWER:</b> {bet.answers.get(player) || "-"}
                    </span>
                </div>
            )
        }
        <br/>
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
