/// Helpers to interact with the Sui network

import { Connection, JsonRpcProvider, SuiTransactionResponse, GetObjectDataResponse, SuiObjectInfo } from '@mysten/sui.js';

const GOTBEEF_PACKAGE_DEVNET = '0xe3c84816ff7131135f56802bf4ddee7e1309391a';
const GOTBEEF_PACKAGE_DEVNET_SPECIAL = '0x29619c35c22cec86e0a2d2ceeb77b2429238f67f';

const GOTBEEF_PACKAGE_TESTNET = '0x123';
const GOTBEEF_PACKAGE_TESTNET_SPECIAL = '0x123';

const RPC_DEVNET = new JsonRpcProvider(new Connection({
  fullnode: 'https://node.shinami.com/api/v1/01c15cf6a15cbe4ac73d0037e4a70ca0',
  faucet: 'https://faucet.devnet.sui.io/gas',
}));

const RPC_TESTNET = new JsonRpcProvider(new Connection({
  fullnode: 'https://fullnode.testnet.sui.io:443/',
  faucet: 'https://faucet.testnet.sui.io/gas',
}));

export function getPackageAndRpc(network: string): [string, JsonRpcProvider] {
    const special = !!localStorage.getItem('polymedia.special');
    switch (network) {
        case 'devnet':
            return [special ? GOTBEEF_PACKAGE_DEVNET_SPECIAL : GOTBEEF_PACKAGE_DEVNET, RPC_DEVNET];
        case 'testnet':
            return [special ? GOTBEEF_PACKAGE_TESTNET_SPECIAL : GOTBEEF_PACKAGE_TESTNET, RPC_TESTNET];
        default:
            throw new Error('Invalid network: ' + network);
    }
}

/// Represents a `gotbeef::bet::Bet<T>` Sui object.
export type Bet = {
    id: string, // The Sui object UID
    collatType: string, // The type of collateral, i.e. the `T` in `Bet<T>`
    title: string,
    description: string,
    quorum: number,
    size: number,
    players: string[],
    judges: string[],
    phase: string,
    funds: object,
    answers: object,
    votesByJudge: object,
    votesByPlayer: object,
    winner?: string,
};

/// Fetch and parse a `gotbeef::bet::Bet<T>` Sui object into our custom Bet type
export async function getBet(network: string, objId: string): Promise<Bet|null> {
    console.debug('[getBet] Looking up:', objId);

    const getPhaseName = (phaseCode: number): string => {
        return ['funding', 'voting', 'settled', 'canceled', 'stalemate'][phaseCode];
    };

    const getCollateralType = (betType: string): string => {
        const match = betType.match(/<(.+)>$/);
        return match ? match[1] : 'ERROR_TYPE_NOT_FOUND';
    };

    const [packageId, rpc] = getPackageAndRpc(network);

    // Handle leading zeros ('0x00ab::bet::Bet' is returned as '0xab::bet::Bet' by the RPC)
    const packageName = packageId.replace(/0x0+/, '0x0*'); // handle leading zeros
    const betTypeRegex = new RegExp(`^${packageName}::bet::Bet<0x.+::.+::.+>$`);
    return rpc.getObject(objId)
        .then((obj: GetObjectDataResponse) => {
            if (obj.status != 'Exists') {
                console.warn('[getBet] Object does not exist. Status:', obj.status);
                return null;
            }

            const details = obj.details as any;
            if (!details.data.type.match(betTypeRegex)) {
                console.warn('[getBet] Found wrong object type:', details.data.type);
                return null;
            } else {
                console.debug('[getBet] Found bet object:', obj);

                const fields = details.data.fields;

                // Parse `Bet.funds: VecMap<address, Coin<T>>`
                let funds = fields.funds.fields.contents || [];
                let fundsByPlayer = new Map(funds.map((obj: any) =>
                    [obj.fields.key, obj.fields.value.fields.balance]
                ));

                // Parse `Bet.answers: VecMap<address, String>`
                let answers = fields.answers.fields.contents || [];
                let answersByPlayer = new Map(answers.map((obj: any) =>
                    [obj.fields.key, obj.fields.value]
                ));

                // Parse `Bet.votes: VecMap<address, address>`
                let votes = fields.votes.fields.contents || [];
                let votesByJudge = new Map();
                let votesByPlayer = new Map();
                votes.forEach((obj: any) => {
                    let judgeAddr = obj.fields.key;
                    let playerAddr = obj.fields.value;
                    votesByJudge.set(judgeAddr, playerAddr);
                    votesByPlayer.set(playerAddr, 1 + (votesByPlayer.get(playerAddr) || 0) );
                });

                const bet: Bet = {
                    id: fields.id.id,
                    collatType: getCollateralType(details.data.type),
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
            console.warn('[getBet] RPC error:', error.message);
            return null;
        });
}

/// Get all `Coin<T>` objects owned by the current address
export async function getCoinObjects(network: string, address: string, type: string): Promise<any[]> {
    console.debug('[getCoinObjects] Looking for Coin objects of type:', type);
    const [_packageId, rpc] = getPackageAndRpc(network);
    return rpc.getObjectsOwnedByAddress(address) // TODO: use https://docs.sui.io/sui-jsonrpc#sui_getCoins
        .then((objectsInfo: SuiObjectInfo[]) => {
            const expectedType = `0x2::coin::Coin<${type}>`;
            let objectIds = objectsInfo.reduce((selected: string[], obj: SuiObjectInfo) => {
                if (obj.type == expectedType)
                    selected.push(obj.objectId);
                return selected;
            }, []);
            return rpc.getObjectBatch(objectIds)
                .then(objectsData => { return objectsData })
                .catch(_error => []);
        })
        .catch(_error => []);
}

/// Get recent bet transactions
export async function getRecentTxns(network: string, limit: number): Promise<SuiTransactionResponse[]> {
    const errorCatcher = (error: any) => {
        console.warn('[getRecentTxns] RPC error:', error.message);
        return [];
    };

    const [packageId, rpc] = getPackageAndRpc(network);

    // @ts-ignore
    const transactions = await rpc.client.batchRequest([{
        method: 'sui_getTransactions',
        args: [{ InputObject: packageId }, null, limit, true],
    }])
    .then(response => response[0].result.data)
    .catch(errorCatcher);

    return rpc.getTransactionWithEffectsBatch(transactions).catch(errorCatcher);
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
