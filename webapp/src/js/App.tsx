import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { JsonRpcProvider } from '@mysten/sui.js';
import { SuiWalletAdapter } from '@mysten/wallet-adapter-sui-wallet';

export function App(props) {
    return (
    <SuiToolsContext.Provider value={suiTools}>
    <div id='page'>

        <div id='header'>
            <h1 id='title'>GOT BEEF?</h1>
            <nav id='nav'>
                <Link to='/'>HOME</Link>
                &nbsp;~ <Link to='/new'>NEW</Link>
                &nbsp;~ <Link to='/find'>FIND</Link>
            </nav>
        </div>

        <div id='content'>
            <Outlet />
        </div>

    </div>
    </SuiToolsContext.Provider>
    );
}

let suiTools = {
    isConnected: async function() {
        let wallet = new SuiWalletAdapter();
        await wallet.connect();
        if (!wallet.connected) {
            return false;
        }
        return true;
    },
    testSdk: async function() {
        const LOOKUP_ADDR = '0x0cd500df96a68db76abc1764d6be4ff7225bd336'; // change this!
        console.debug("--- testSdk ---");
        console.debug("Looking up:", LOOKUP_ADDR);

        const provider = new JsonRpcProvider('https://gateway.devnet.sui.io:443'); // DevNet
        // const provider = new JsonRpcProvider('http://127.0.0.1:5001'); // local network
        // const objects = await provider.getObjectsOwnedByAddress(LOOKUP_ADDR);

        // console.debug("Found " + objects.length + " objects. First object:");
        // console.log(objects[0]);

        let obj_id = '0xdab9c8c6923b962acd6349345a13db9bb1a63e06';
        const object = await provider.getObject(obj_id);
        window.o = object;
        console.log(object);
        // console.log(o.details.data.fields);
    },
    testWalletAdapter: async function() {
        const PACKAGE_ID = '0x83f9343d824bee8ab2cb009c12e77b81624e76c6'; // change this!
        console.debug("--- testWalletAdapter ---");

        let adapter = new SuiWalletAdapter();
        await adapter.connect();
        if (!adapter.connected) {
            console.error("ERROR: Couldn't conect to wallet");
            return;
        }
        console.debug("SUCCESS: Connected to Sui wallet");

        console.debug("Calling beef::bet::create()");
        adapter.executeMoveCall({
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
            (result) => { console.log("SUCCESS! Result:\n-----\n", result) },
            (error) => { console.log("ERROR! Result:\n-----\n", error) },
        );

        /*
        console.debug("Calling sui::devnet_nft::mint()");
        adapter.executeMoveCall({
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
        */
    }
};
export const SuiToolsContext = React.createContext(suiTools);
