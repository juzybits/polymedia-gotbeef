import { JsonRpcProvider } from '@mysten/sui.js';
import { SuiWalletAdapter } from '@mysten/wallet-adapter-sui-wallet';

const GOTBEEF_PACKAGE = '0xffb3deddef032b8c12c21854e28a965d7fcf4db1';
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

export function createBet(
    currency: string, // e.g. '0x2::sui::SUI'
    title: string,
    description: string,
    quorum: number,
    size: number,
    players: array,
    judges: array,
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

export async function fundBet(betObj: object): Promise<SuiTransactionResponse>
{
    console.debug(`[fundBet] Calling bet::fund on package: ${GOTBEEF_PACKAGE}`);
    return wallet.executeMoveCall({
        packageObjectId: GOTBEEF_PACKAGE,
        module: 'bet',
        function: 'fund',
        typeArguments: [ getCollateralType(betObj) ],
        arguments: [
            betObj.details.data.fields.id.id,
            '0xfad92c3e58e04604c02a619d01a1727786b01565', // TODO find Coin<T> in user wallet
        ],
        gasBudget: 10000,
    });
}

export async function cancelBet(betObj: object): Promise<SuiTransactionResponse>
{
    console.debug(`[fundBet] Calling bet::cancel on package: ${GOTBEEF_PACKAGE}`);
    return wallet.executeMoveCall({
        packageObjectId: GOTBEEF_PACKAGE,
        module: 'bet',
        function: 'cancel',
        typeArguments: [ getCollateralType(betObj) ],
        arguments: [
            betObj.details.data.fields.id.id,
        ],
        gasBudget: 10000,
    });
}

export async function vote(betObj: object, player_addr: string): Promise<SuiTransactionResponse>
{
    console.debug(`[fundBet] Calling bet::vote on package: ${GOTBEEF_PACKAGE}`);
    return wallet.executeMoveCall({
        packageObjectId: GOTBEEF_PACKAGE,
        module: 'bet',
        function: 'vote',
        typeArguments: [ getCollateralType(betObj) ],
        arguments: [
            betObj.details.data.fields.id.id,
            player_addr,
        ],
        gasBudget: 10000,
    });
}

export async function getBetObj(objId: string): Promise<object|null> {
    console.debug('[getObject] Looking up:', objId);
    return rpc.getObject(objId)
        .then(obj => {
            window.x = obj; // DEV_ONLY
            if (obj.status != 'Exists') {
                console.warn('[getBetObj] Object does not exist. Status:', obj.status);
                return null;
            } else
            if (!obj.details.data.type.match(/^0x.+::bet::Bet<0x.+::.+::.+>$/)) {
                console.warn('[getBetObj] Found wrong object type:', obj.details.data.type);
                return null;
            } else {
                console.debug('[getBetObj] Found bet object:', obj);
                return obj;
            }
        })
        .catch(error => {
            console.warn('[getBetObj] RPC error:', error.message);
            return null;
        });
}

// TODO: include in betObj
export function getPhaseName(betObj: object): string {
    const phaseCode = betObj.details.data.fields.phase;
    return ['fund', 'vote', 'settled', 'canceled', 'stalemate'][phaseCode];
};

// TODO: include in betObj
export function getCollateralType(betObj: object): string {
    const match = betObj.details.data.type.match(/<(.+)>$/);
    return match ? match[1] : 'ERROR_TYPE_NOT_FOUND';
};

export function getErrorName(error: string): string {
    const match = error.match(/^MoveAbort.+, (\d+)\)$/)
    if (!error.match(/^MoveAbort/)) {
        return error;
    }
    const errCode = match[1];
    return ERROR_NAMES[errCode] || error;
}

// DEV_ONLY

export async function testSdk(): void {
    // const rpc = new JsonRpcProvider('http://127.0.0.1:5001');

    console.debug('--- testSdk ---');

    const LOOKUP_ADDR = '0xff524a4a89513ebaa96905c5335f0c51615e48da';
    console.debug('Looking up address:', LOOKUP_ADDR);
    const objects = await rpc.getObjectsOwnedByAddress(LOOKUP_ADDR);
    console.debug('Found ' + objects.length + ' objects:');
    console.log(objects);

    let OBJECT_ID = '0x6d34ab1a878b93cbb8ee9a53241a517805340824';
    console.debug('Looking up object:', OBJECT_ID);
    const object = await rpc.getObject(OBJECT_ID);
    console.log(object);
};

export async function testWalletAdapter(): void {
    console.debug('--- testWalletAdapter ---');

    console.debug('Calling sui::devnet_nft::mint()');
    wallet.executeMoveCall({
        packageObjectId: '0x2',
        module: 'devnet_nft',
        function: 'mint',
        typeArguments: [],
        arguments: ['Isaac', 'The OG of gravity', 'https://upload.wikimedia.org/wikipedia/commons/3/39/GodfreyKneller-IsaacNewton-1689.jpg'],
        gasBudget: 10000,
    })
    .then(
        (result) => { console.debug('SUCCESS! Result:\n', result) },
        (error) => { console.error('ERROR! Result:\n', error) },
    );

    /*
    const PACKAGE_ID = '0x854ecb501c90ef40b0b08c11929fa0c6c5cec90e';
    console.debug('Calling bet::create on package:', PACKAGE_ID);
    wallet.executeMoveCall({
        packageObjectId: PACKAGE_ID,
        module: 'bet',
        function: 'create',
        typeArguments: [ '0x2::sui::SUI' ],
        arguments: [
            'Bet title',
            'Bet description',
            1, // quorum
            100, // bet size
            ['0x8d7ee30cc813ca4f90ebbef8f0ac111e8d8cc0fa', '0xc021996424af16178be2cb2f2133f3b134063c77'], // players
            ['0xe304f2348d4514d2e517b746a07cd98b8f2631fa'], // judges
        ],
        gasBudget: 10000,
    })
    .then(
        (result) => { console.debug('SUCCESS! Result:\n-----\n', result) },
        (error) => { console.debug('ERROR! Result:\n-----\n', error) },
    );
    */
}
