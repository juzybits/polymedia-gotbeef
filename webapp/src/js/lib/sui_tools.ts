import { JsonRpcProvider } from '@mysten/sui.js';
import { SuiWalletAdapter } from '@mysten/wallet-adapter-sui-wallet';

const GOTBEEF_PACKAGE = '0x5f4632e0fd5405f3cb049093694d414f4aac47e0';
const rpc = new JsonRpcProvider('https://gateway.devnet.sui.io:443');
const wallet = new SuiWalletAdapter();

export async function connect(): void {
    await wallet.connect();
};

export function disconnect(): void {
    wallet.disconnect();
};

export function isConnected(): bool {
    return wallet.connected;
};

/// Get all `Coin<T>` objects owned by the current address
export async function getCoinObjects(type: string): Promise<any[]> {
    console.debug('[getCoinObjects] Looking for Coin objects of type:', type);
    return wallet.getAccounts()
    .then(accounts => {
        return !accounts
        ? []
        : rpc.getObjectsOwnedByAddress(accounts[0])
            .then(objects_info => {
                const expectedType = `0x2::coin::Coin<${type}>`;
                let objectIds = objects_info.reduce((selected, obj) => {
                    if (obj.type == expectedType)
                        selected.push(obj.objectId);
                    return selected;
                }, []);
                return rpc.getObjectBatch(objectIds)
                    .then(objects_data => { return objects_data })
                    .catch(error => { return [] });
            })
            .catch(error => { return [] });
    })
    .catch(error => { return [] });
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
    votesByJudge: object,
    votesByPlayer: object,
    winner?: string,
};

export async function getbet(objId: string): Promise<Bet|null> {
    console.debug('[getObject] Looking up:', objId);

    const getPhaseName = (phaseCode: number): string => {
        return ['fund', 'vote', 'settled', 'canceled', 'stalemate'][phaseCode];
    };

    const getCollateralType = (betType: string): string => {
        const match = betType.match(/<(.+)>$/);
        return match ? match[1] : 'ERROR_TYPE_NOT_FOUND';
    };

    return rpc.getObject(objId)
        .then(obj => {
            window.obj = obj; // DEV_ONLY
            if (obj.status != 'Exists') {
                console.warn('[getbet] Object does not exist. Status:', obj.status);
                return null;
            } else
            if (!obj.details.data.type.match(/^0x.+::bet::Bet<0x.+::.+::.+>$/)) {
                console.warn('[getbet] Found wrong object type:', obj.details.data.type);
                return null;
            } else {
                console.debug('[getbet] Found bet object:', obj);

                const fields = obj.details.data.fields;

                // Parse `Bet.funds: VecMap<address, Coin<T>>`
                let funds = fields.funds.fields.contents || [];
                let fundsByPlayer = new Map(funds.map(obj =>
                    [obj.fields.key, obj.fields.value.fields.balance]
                ));

                // Parse `Bet.votes: VecMap<address, address>`
                let votes = fields.votes.fields.contents || [];
                let votesByJudge = new Map();
                let votesByPlayer = new Map();
                votes.forEach(obj => {
                    let judgeAddr = obj.fields.key;
                    let playerAddr = obj.fields.value;
                    votesByJudge.set(judgeAddr, playerAddr);
                    votesByPlayer.set(playerAddr, 1 + (votesByPlayer.get(playerAddr) || 0) );
                });

                const bet: Bet = {
                    id: fields.id.id,
                    collatType: getCollateralType(obj.details.data.type),
                    title: fields.title,
                    description: fields.description,
                    quorum: fields.quorum,
                    size: fields.size,
                    players: fields.players,
                    judges: fields.judges,
                    phase: getPhaseName(fields.phase),
                    funds: fundsByPlayer,
                    votesByJudge: votesByJudge,
                    votesByPlayer: votesByPlayer,
                    winner: typeof fields.winner === 'object' ? '' : fields.winner,
                };
                window.fields = fields; // DEV_ONLY
                return bet;
            }
        })
        .catch(error => {
            console.warn('[getbet] RPC error:', error.message);
            return null;
        });
}

export function getErrorName(error: string): string {
    const ERROR_NAMES = { // from bet.move
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
        '300': 'E_CANCEL_BET_HAS_FUNDS',
        '301': 'E_CANCEL_NOT_AUTHORIZED',
    }
    const match = error.match(/^MoveAbort.+, (\d+)\)$/)
    if (!error.match(/^MoveAbort/)) {
        return error;
    }
    const errCode = match[1];
    return ERROR_NAMES[errCode] || error;
}

export function createBet(
    currency: string, // e.g. '0x2::sui::SUI'
    title: string,
    description: string,
    quorum: number,
    size: number,
    players: string[],
    judges: string[],
): Promise<SuiTransactionResponse>
{
    console.debug(`[createBet] Calling bet::create on package: ${GOTBEEF_PACKAGE}`);
    return wallet.executeMoveCall({
        packageObjectId: GOTBEEF_PACKAGE,
        module: 'bet',
        function: 'create',
        typeArguments: [ currency ],
        arguments: [
            title,
            description,
            quorum,
            size,
            players,
            judges,
        ],
        gasBudget: 10000,
    });
}

export async function fundBet(bet: Bet, coin: string): Promise<SuiTransactionResponse>
{
    console.debug(`[fundBet] Calling bet::fund on package: ${GOTBEEF_PACKAGE}`);
    return wallet.executeMoveCall({
        packageObjectId: GOTBEEF_PACKAGE,
        module: 'bet',
        function: 'fund',
        typeArguments: [ bet.collatType ],
        arguments: [
            bet.id,
            coin,
        ],
        gasBudget: 10000,
    });
}

export async function cancelBet(bet: Bet): Promise<SuiTransactionResponse>
{
    console.debug(`[fundBet] Calling bet::cancel on package: ${GOTBEEF_PACKAGE}`);
    return wallet.executeMoveCall({
        packageObjectId: GOTBEEF_PACKAGE,
        module: 'bet',
        function: 'cancel',
        typeArguments: [ bet.collatType ],
        arguments: [
            bet.id,
        ],
        gasBudget: 10000,
    });
}

export async function castVote(bet: Bet, player_addr: string): Promise<SuiTransactionResponse>
{
    console.debug(`[fundBet] Calling bet::vote on package: ${GOTBEEF_PACKAGE}`);
    return wallet.executeMoveCall({
        packageObjectId: GOTBEEF_PACKAGE,
        module: 'bet',
        function: 'vote',
        typeArguments: [ bet.collatType ],
        arguments: [
            bet.id,
            player_addr,
        ],
        gasBudget: 10000,
    });
}
