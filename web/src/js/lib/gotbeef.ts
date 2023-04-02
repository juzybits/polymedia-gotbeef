/// Helpers to interact with the Sui network

import {
    Connection,
    JsonRpcProvider,
    SuiAddress,
    SuiMoveObject,
} from '@mysten/sui.js';

const GOTBEEF_PACKAGE_LOCALNET = '0x1a985987ed7d70ad92612bcdb76b0c5c86ead5b084c0d9b840019c8aa20718a9';
const GOTBEEF_PACKAGE_LOCALNET_SPECIAL = '0x3eb38194f47f3b28f9c2f4ccd1dda4bc2a247ff39b06eacb35fc306cd69cfa7e';

const GOTBEEF_PACKAGE_DEVNET = '0x8cbb5f505de6255df598c60703d3e83d3065fc70afa6651033b47e77e06b52fb';
const GOTBEEF_PACKAGE_DEVNET_SPECIAL = '0xf0dfa7f7d5c286dcfc72d5ef0aaaa6777e0bf0f9490730d07518525b83a6a9f6';

const GOTBEEF_PACKAGE_TESTNET = '0x123';
const GOTBEEF_PACKAGE_TESTNET_SPECIAL = '0x123';

const RPC_LOCALNET = new JsonRpcProvider(new Connection({
    fullnode: 'http://127.0.0.1:9000',
    faucet: 'http://127.0.0.1:9123',
}));

const RPC_DEVNET = new JsonRpcProvider(new Connection({
    fullnode: 'https://fullnode.devnet.sui.io:443',
    // fullnode: 'https://node.shinami.com/api/v1/dd67104025845f18ba98bf68489b84eb',
    // fullnode: 'https://sui-devnet-endpoint.blockvision.org',
    // fullnode: 'https://fullnode.devnet.vincagame.com:443',
    faucet: 'https://faucet.devnet.sui.io/gas',
}));

const RPC_TESTNET = new JsonRpcProvider(new Connection({
    fullnode: 'https://fullnode.testnet.sui.io:443',
    // fullnode: 'https://sui-testnet-endpoint.blockvision.org',
    // fullnode: 'https://fullnode.testnet.vincagame.com:443',
    faucet: 'https://faucet.testnet.sui.io/gas',
}));

type Config = {
    rpc: JsonRpcProvider;
    packageId: string;
};

export function getConfig(network: string): Config {
    const special = localStorage.getItem('polymedia.special') === '1';
    switch (network) {
        case 'localnet':
            return {
                rpc: RPC_LOCALNET,
                packageId: special ? GOTBEEF_PACKAGE_LOCALNET_SPECIAL : GOTBEEF_PACKAGE_LOCALNET,
            };
        case 'devnet':
            return {
                rpc: RPC_DEVNET,
                packageId: special ? GOTBEEF_PACKAGE_DEVNET_SPECIAL : GOTBEEF_PACKAGE_DEVNET,
            };
        case 'testnet':
            return {
                rpc: RPC_TESTNET,
                packageId: special ? GOTBEEF_PACKAGE_TESTNET_SPECIAL : GOTBEEF_PACKAGE_TESTNET,
            };
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
export async function getBet(network: string, objId: string): Promise<Bet|null> {
    console.debug('[getBet] Looking up:', objId);

    const getPhaseName = (phaseCode: number): string => {
        return ['funding', 'voting', 'settled', 'canceled', 'stalemate'][phaseCode];
    };

    const getCollateralType = (betType: string): string => {
        const match = betType.match(/<(.+)>$/);
        return match ? match[1] : 'ERROR_TYPE_NOT_FOUND';
    };

    const {packageId, rpc} = getConfig(network);

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
