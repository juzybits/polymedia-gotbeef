import { JsonRpcProvider } from '@mysten/sui.js';
import { SuiWalletAdapter } from '@mysten/wallet-adapter-sui-wallet';

const rpc = new JsonRpcProvider('https://gateway.devnet.sui.io:443');
let wallet = new SuiWalletAdapter();
window.wallet = wallet; // DEV_ONLY

export async function connect(): void {
    await wallet.connect();
};

export function disconnect(): void {
    wallet.disconnect();
};

export function isConnected(): bool {
    return wallet.connected;
};

export async function testSdk(): void {
    // let rpc = new JsonRpcProvider('http://127.0.0.1:5001');

    console.debug("--- testSdk ---");

    const LOOKUP_ADDR = '0xff524a4a89513ebaa96905c5335f0c51615e48da';
    console.debug("Looking up address:", LOOKUP_ADDR);
    const objects = await rpc.getObjectsOwnedByAddress(LOOKUP_ADDR);
    console.debug("Found " + objects.length + " objects:");
    console.log(objects);

    let OBJECT_ID = '0x6d34ab1a878b93cbb8ee9a53241a517805340824';
    console.debug("Looking up object:", OBJECT_ID);
    const object = await rpc.getObject(OBJECT_ID);
    console.log(object);
};

export async function testWalletAdapter(): void {
    console.debug("--- testWalletAdapter ---");

    console.debug("Calling sui::devnet_nft::mint()");
    wallet.executeMoveCall({
        packageObjectId: '0x2',
        module: 'devnet_nft',
        function: 'mint',
        typeArguments: [],
        arguments: ["Isaac", "The OG of gravity", "https://upload.wikimedia.org/wikipedia/commons/3/39/GodfreyKneller-IsaacNewton-1689.jpg"],
        gasBudget: 10000,
    })
    .then(
        (result) => { console.debug("SUCCESS! Result:\n", result) },
        (error) => { console.error("ERROR! Result:\n", error) },
    );

    /*
    const PACKAGE_ID = '0x854ecb501c90ef40b0b08c11929fa0c6c5cec90e';
    console.debug("Calling bet::create() on package:", PACKAGE_ID);
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
        (result) => { console.debug("SUCCESS! Result:\n-----\n", result) },
        (error) => { console.debug("ERROR! Result:\n-----\n", error) },
    );
    */
}
