import { useCurrentAccount, useSignTransaction, useSuiClient } from "@mysten/dapp-kit";
import { CoinBalance } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { getCoinOfValue } from "@polymedia/suitcase-core";
import React, { SyntheticEvent, useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { AppContext } from "./App";
import { showConfetti } from "./lib/confetti";
import { Bet, getConfig, getErrorName } from "./lib/gotbeef";

export const Fund: React.FC<{
    bet: Bet;
    reloadBet: () => Promise<void>;
    setModal: React.Dispatch<React.SetStateAction<React.ReactNode|null>>;
}> = ({
    bet,
    reloadBet,
    setModal,
}) => {
    const suiClient = useSuiClient();
    const currentAccount = useCurrentAccount();
    const { mutateAsync: signTransaction } = useSignTransaction();

    const { network } = useOutletContext<AppContext>();

    const {packageId} = getConfig(network);
    const [userHasFunds, setUserHasFunds] = useState(false);
    const [answer, setAnswer] = useState("");
    const [error, setError] = useState("");

    // Look for a Coin<T> with enough balance to fund the bet

    useEffect(() => {
        checkUserFunds()
        .catch((err: unknown) => {
            console.warn("[checkUserFunds]", err);
            setError("[checkUserFunds] " + (err instanceof Error ? err.message : String(err)));
        });
    }, [currentAccount]);

    const checkUserFunds = async () =>
    {
        setUserHasFunds(false);
        setError("");

        if (!currentAccount) {
            throw new Error("Wallet not connected");
        }

        const coinBalance: CoinBalance = await suiClient.getBalance({
            owner: currentAccount.address,
            coinType: bet.collatType,
        });

        if (bet.size > BigInt(coinBalance.totalBalance)) {
            throw new Error("Your wallet doesn't have enough balance to fund the bet");
        } else {
            setUserHasFunds(true);
        }
    };

    const fundBet = async (
        bet: Bet,
        answer: string,
    ): ReturnType<typeof suiClient["executeTransactionBlock"]> =>
    {
        if (!currentAccount) {
            throw new Error("Wallet not connected");
        }
        console.debug(`[fundBet] Calling bet::fund on package: ${packageId}`);

        const tx = new Transaction();

        const fundingCoin = await getCoinOfValue(
            suiClient,
            tx,
            currentAccount.address,
            bet.collatType,
            bet.size,
        );

        tx.moveCall({
            target: `${packageId}::bet::fund`,
            typeArguments: [ bet.collatType ],
            arguments: [
                tx.object(bet.id),
                tx.pure.string(answer),
                fundingCoin,
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

    const onClickFund = (e: SyntheticEvent) =>
    {
        e.preventDefault();
        fundBet(bet, answer)
        .then(resp => {
            const effects = resp.effects!;
            if (effects.status.status == "success") {
                showConfetti("💸");
                setError("");
                setModal("");
                reloadBet();
                console.debug("[onClickFund] Success:", resp);
            } else {
                setError( getErrorName(effects.status.error) );
            }
        })
        .catch((err: unknown) => {
            console.warn("[onClickFund]", err);
            setError( getErrorName(err) );
        });
    };

    const onClickBack = () => {
        setModal("");
    };

    return <section className="bet-modal">
        <h2>Fund bet</h2>
        <div>
            Bet size is {bet.size/1_000_000_000} <i className="nes-icon coin is-small" /> {bet.collatType}
            <br/>
            <form onSubmit={onClickFund} className="nes-field">
                <label htmlFor="answer_field">Answer (optional)</label>
                <input type="text" id="answer_field" className={`nes-input ${userHasFunds ? "" : "is-disabled"}`} maxLength={500}
                    spellCheck="false" autoCorrect="off" autoComplete="off"
                    value={answer} disabled={!userHasFunds} onChange={e => setAnswer(e.target.value)}
                />
            </form>
            <br/>
            <button type="button" className={`nes-btn ${userHasFunds ? "is-success" : "is-disabled"}`}
                    disabled={!userHasFunds} onClick={onClickFund}>
                FUND
            </button>
            &nbsp;
            <button type="button" className="nes-btn" onClick={onClickBack}>
                BACK
            </button>
        </div>
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
