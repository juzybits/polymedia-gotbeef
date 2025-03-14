/// Helpers to interact with the Sui network

import { SuiClient } from "@mysten/sui/client";
import { NetworkName } from "@polymedia/suitcase-core";

const GOTBEEF_PACKAGE_MAINNET = "0x8221cc562f8c58c922c6a40ecbc7e2f16b0159fb683470c22e96d21a0dc52beb";
const GOTBEEF_PACKAGE_TESTNET = "0x7eac492d418a9d193c0cb142ab7be5eda6abbf00d40a58735deab356a42fdff6";
const GOTBEEF_PACKAGE_DEVNET = "";
const GOTBEEF_PACKAGE_LOCALNET = "";

type Config = {
    packageId: string;
};
export function getConfig(network: NetworkName): Config {
    switch (network) {
        case "mainnet":
            return { packageId: GOTBEEF_PACKAGE_MAINNET };
        case "testnet":
            return { packageId: GOTBEEF_PACKAGE_TESTNET };
        case "devnet":
            return { packageId: GOTBEEF_PACKAGE_DEVNET };
        case "localnet":
            return { packageId: GOTBEEF_PACKAGE_LOCALNET };
    }
}

/// Represents a `gotbeef::bet::Bet<T>` Sui object.
export type Bet = {
    id: string; // The Sui object UID
    collatType: string; // The type of collateral, i.e. the `T` in `Bet<T>`
    title: string;
    description: string;
    quorum: number;
    size: number;
    players: string[];
    judges: string[];
    phase: string;
    funds: Map<string, number>;
    answers: Map<string, string>;
    votesByJudge: Map<string, string>;
    votesByPlayer: Map<string, number>;
    winner?: string;
};

/// Fetch and parse a `gotbeef::bet::Bet<T>` Sui object into our custom Bet type
export async function getBet(network: NetworkName, rpc: SuiClient, objId: string): Promise<Bet|null> {
    console.debug("[getBet] Looking up:", objId);

    const getPhaseName = (phaseCode: number): string => {
        return ["funding", "voting", "settled", "canceled", "stalemate"][phaseCode];
    };

    const getCollateralType = (betType: string): string => {
        const match = betType.match(/<(.+)>$/);
        return match ? match[1] : "ERROR_TYPE_NOT_FOUND";
    };

    const {packageId} = getConfig(network);

    // Handle leading zeros ('0x00ab::bet::Bet' is returned as '0xab::bet::Bet' by the RPC)
    const packageName = packageId.replace(/0x0+/, "0x0*"); // handle leading zeros
    const betTypeRegex = new RegExp(`^${packageName}::bet::Bet<0x.+::.+::.+>$`);
    return rpc.getObject({
            id: objId,
            options: {
                showContent: true,
            },
        })
        .then(resp => {
            if (resp.error || !resp.data) {
                console.warn("[getBet] Error loading bet:", resp.error);
                return null;
            }
            const content = resp.data.content;
            if (!content) {
                console.warn("[getBet] Missing object content. Make sure to fetch the object with `showContent: true`");
                return null;
            }
            if (content.dataType !== "moveObject") {
                console.warn(`[getBet] Wrong object dataType. Expected 'moveObject' but got: '${content.dataType}'`);
                return null;
            }
            if (!content.type.match(betTypeRegex)) {
                console.warn("[getBet] Found wrong object type:", content.type);
                return null;
            }

            console.debug("[getBet] Found bet object " + resp.data.objectId);

            /* eslint-disable */
            const fields: Record<string, any> = content.fields;

            // Parse `Bet.funds: VecMap<address, Coin<T>>`
            const funds = fields.funds.fields.contents || [];
            const fundsByPlayer = new Map<string, number>(
                funds.map((obj: any) => [obj.fields.key, obj.fields.value.fields.balance])
            );

            // Parse `Bet.answers: VecMap<address, String>`
            const answers = fields.answers.fields.contents || [];
            const answersByPlayer = new Map<string, string>(
                answers.map((obj: any) => [obj.fields.key, obj.fields.value])
            );

            // Parse `Bet.votes: VecMap<address, address>`
            const votes = fields.votes.fields.contents || [];
            const votesByJudge = new Map<string, string>();
            const votesByPlayer = new Map<string, number>();
            votes.forEach((obj: any) => {
                const judgeAddr = obj.fields.key;
                const playerAddr = obj.fields.value;
                votesByJudge.set(judgeAddr, playerAddr);
                votesByPlayer.set(playerAddr, 1 + (votesByPlayer.get(playerAddr) || 0) );
            });

            const bet: Bet = {
                id: fields.id.id,
                collatType: getCollateralType(content.type),
                title: fields.title,
                description: fields.description,
                quorum: fields.quorum,
                size: fields.size,
                players: fields.players,
                judges: fields.judges,
                phase: getPhaseName(fields.phase),
                funds: fundsByPlayer,
                answers: answersByPlayer,
                votesByJudge: votesByJudge,
                votesByPlayer: votesByPlayer,
                winner: typeof fields.winner === "object" ? "" : fields.winner,
            };
            /* eslint-enable */

            return bet;
        })
        .catch((err: unknown) => {
            console.warn("[getBet]", err);
            return null;
        });
}

export function getErrorName(error?: unknown): string {
    const errMsg = (error instanceof Error ? error.message : String(error));

    if (errMsg.length === 0) {
        return "unknown error";
    }

    const noBalanceTxt = "Unable to select a gas object with balance greater than or equal to";
    if (errMsg.includes(noBalanceTxt)) {
        return "Your wallet doesn't have enough balance to pay for the transaction";
    }

    const match = errMsg.match(/MoveAbort.+, (\d+)\)/);
    if (!match) {
        return errMsg;
    }
    const errCode = match[1];
    const errorNames: Record<string, string> = { // from bet.move
        // create()
        "0": "E_JUDGES_CANT_BE_PLAYERS",
        "2": "E_INVALID_NUMBER_OF_PLAYERS",
        "3": "E_INVALID_NUMBER_OF_JUDGES",
        "4": "E_DUPLICATE_PLAYERS",
        "5": "E_DUPLICATE_JUDGES",
        "6": "E_INVALID_QUORUM",
        "7": "E_INVALID_BET_SIZE",
        // fund()
        "100": "E_ONLY_PLAYERS_CAN_FUND",
        "101": "E_ALREADY_FUNDED",
        "102": "E_FUNDS_BELOW_BET_SIZE",
        "103": "E_NOT_IN_FUNDING_PHASE",
        // vote()
        "200": "E_NOT_IN_VOTING_PHASE",
        "201": "E_ONLY_JUDGES_CAN_VOTE",
        "202": "E_ALREADY_VOTED",
        "203": "E_PLAYER_NOT_FOUND",
        // cancel()
        "300": "E_BET_HAS_FUNDS",
        "301": "E_NOT_AUTHORIZED",
    };
    return errorNames[errCode] || errMsg;
}
