/// Helpers to interact with the Sui network


import { JsonRpcProvider, SuiAddress, SuiMoveObject } from '@mysten/sui.js';
import { NetworkName } from '@polymedia/webutils';

const GOTBEEF_PACKAGE_LOCALNET = '0x965d1bfb15be36bdd041ce93825926a31668b27427e9d4f1d0dccdd75df622a0';
const GOTBEEF_PACKAGE_DEVNET = '0xe3bf7bfbe0c7053e37e836e7c9fd8ee506a9b9df52da0ac75496c9b21d3358d1';
const GOTBEEF_PACKAGE_TESTNET = '0x69caca41c789f88541abe2259b92703b89d27216a586ac2df65ff9431094be5d';
const GOTBEEF_PACKAGE_MAINNET = '0x8221cc562f8c58c922c6a40ecbc7e2f16b0159fb683470c22e96d21a0dc52beb';

type Config = {
    packageId: string;
};
export function getConfig(network: NetworkName): Config {
    switch (network) {
        case 'localnet':
            return { packageId: GOTBEEF_PACKAGE_LOCALNET };
        case 'devnet':
            return { packageId: GOTBEEF_PACKAGE_DEVNET };
        case 'testnet':
            return { packageId: GOTBEEF_PACKAGE_TESTNET };
        case 'mainnet':
            return { packageId: GOTBEEF_PACKAGE_MAINNET };
        default:
            throw new Error('Invalid network: ' + network);
    }
}

/// Represents a `gotbeef::bet::Bet<T>` Sui object.
export type Bet = {
    id: SuiAddress, // The Sui object UID
    collatType: string, // The type of collateral, i.e. the `T` in `Bet<T>`
    title: string,
    description: string,
    quorum: number,
    size: number,
    players: SuiAddress[],
    judges: SuiAddress[],
    phase: string,
    funds: Map<SuiAddress, number>,
    answers: Map<SuiAddress, string>,
    votesByJudge: Map<SuiAddress, SuiAddress>,
    votesByPlayer: Map<SuiAddress, number>,
    winner?: SuiAddress,
};

/// Fetch and parse a `gotbeef::bet::Bet<T>` Sui object into our custom Bet type
export async function getBet(network: NetworkName, rpc: JsonRpcProvider, objId: string): Promise<Bet|null> {
    console.debug('[getBet] Looking up:', objId);

    const getPhaseName = (phaseCode: number): string => {
        return ['funding', 'voting', 'settled', 'canceled', 'stalemate'][phaseCode];
    };

    const getCollateralType = (betType: string): string => {
        const match = betType.match(/<(.+)>$/);
        return match ? match[1] : 'ERROR_TYPE_NOT_FOUND';
    };

    const {packageId} = getConfig(network);

    // Handle leading zeros ('0x00ab::bet::Bet' is returned as '0xab::bet::Bet' by the RPC)
    const packageName = packageId.replace(/0x0+/, '0x0*'); // handle leading zeros
    const betTypeRegex = new RegExp(`^${packageName}::bet::Bet<0x.+::.+::.+>$`);
    return rpc.getObject({
            id: objId,
            options: {
                showContent: true,
            },
        })
        .then(resp => {
            if (resp.error || !resp.data) {
                console.warn('[getBet] Error loading bet:', resp.error);
                return null;
            }
            const obj = resp.data.content as SuiMoveObject;
            if (!obj.type.match(betTypeRegex)) {
                console.warn('[getBet] Found wrong object type:', obj.type);
                return null;
            } else {
                console.debug('[getBet] Found bet object ' + resp.data.objectId);

                const fields = obj.fields;

                // Parse `Bet.funds: VecMap<address, Coin<T>>`
                let funds = fields.funds.fields.contents || [];
                let fundsByPlayer = new Map<SuiAddress, number>(
                    funds.map((obj: any) => [obj.fields.key, obj.fields.value.fields.balance])
                );

                // Parse `Bet.answers: VecMap<address, String>`
                let answers = fields.answers.fields.contents || [];
                let answersByPlayer = new Map<SuiAddress, string>(
                    answers.map((obj: any) => [obj.fields.key, obj.fields.value])
                );

                // Parse `Bet.votes: VecMap<address, address>`
                let votes = fields.votes.fields.contents || [];
                let votesByJudge = new Map<SuiAddress, SuiAddress>();
                let votesByPlayer = new Map<SuiAddress, number>();
                votes.forEach((obj: any) => {
                    let judgeAddr = obj.fields.key;
                    let playerAddr = obj.fields.value;
                    votesByJudge.set(judgeAddr, playerAddr);
                    votesByPlayer.set(playerAddr, 1 + (votesByPlayer.get(playerAddr) || 0) );
                });

                const bet: Bet = {
                    id: fields.id.id,
                    collatType: getCollateralType(obj.type),
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
                    winner: typeof fields.winner === 'object' ? '' : fields.winner,
                };
                return bet;
            }
        })
        .catch(error => {
            console.warn('[getBet]', error.stack);
            return null;
        });
}

export function getErrorName(error?: string): string {
    if (!error) {
        return 'unknown error';
    }

    const noBalanceTxt = 'Unable to select a gas object with balance greater than or equal to';
    if (error.includes(noBalanceTxt)) {
        return 'Your wallet doesn\'t have enough balance to pay for the transaction';
    }

    const match = error.match(/^MoveAbort.+, (\d+)\)$/)
    if (!match) {
        return error;
    }
    const errCode = match[1];
    const errorNames: Record<string, string> = { // from bet.move
        // create()
        '0': 'E_JUDGES_CANT_BE_PLAYERS',
        '2': 'E_INVALID_NUMBER_OF_PLAYERS',
        '3': 'E_INVALID_NUMBER_OF_JUDGES',
        '4': 'E_DUPLICATE_PLAYERS',
        '5': 'E_DUPLICATE_JUDGES',
        '6': 'E_INVALID_QUORUM',
        '7': 'E_INVALID_BET_SIZE',
        // fund()
        '100': 'E_ONLY_PLAYERS_CAN_FUND',
        '101': 'E_ALREADY_FUNDED',
        '102': 'E_FUNDS_BELOW_BET_SIZE',
        '103': 'E_NOT_IN_FUNDING_PHASE',
        // vote()
        '200': 'E_NOT_IN_VOTING_PHASE',
        '201': 'E_ONLY_JUDGES_CAN_VOTE',
        '202': 'E_ALREADY_VOTED',
        '203': 'E_PLAYER_NOT_FOUND',
        // cancel()
        '300': 'E_BET_HAS_FUNDS',
        '301': 'E_NOT_AUTHORIZED',
    };
    return errorNames[errCode] || error;
}
