import React, { useEffect, useState, SyntheticEvent } from 'react';
import { useWallet } from '@mysten/wallet-adapter-react';
import { ButtonConnect } from './components/ButtonConnect';
import { shorten } from './lib/common';
import { rpc } from './lib/sui_tools';

export function Chat(props: any)
{
    const POLYMEDIA_PACKAGE = '0xbd445c1241668e4d47e92c6282803a2dfadb0e55';
    const CHAT_ID = '0x936f0999f5866493e8700cd09b40dce88a721846';
    const GAS_BUDGET = 10000;

    const [error, setError] = useState('');
    const [chatError, setChatError] = useState('');
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [waiting, setWaiting] = useState(false);

    const { connected, signAndExecuteTransaction } = useWallet();

    /* Effects */

    useEffect(() => {
        document.title = 'Got Beef? - Chat';
        reloadChat();
        const interval = setInterval(() => { reloadChat(); }, 15000);
        return () => { clearInterval(interval); }
    }, []);

    useEffect(() => {
        scrollToEndOfChat();
    }, [messages]);

    /* Helpers */

    const reloadChat = async () => {
        console.debug('[reloadChat] Fetching object:', CHAT_ID);
        rpc.getObject(CHAT_ID)
        .then((obj: any) => {
            if (obj.status != 'Exists') {
                setError(`[reloadChat] Object does not exist. Status: ${obj.status}`);
            } else {
                setError('');
                const messages = obj.details.data.fields.messages;
                if (messages) {
                    setMessages( messages.map((msg: any) => msg.fields) );
                }
            }
        })
        .catch(err => {
            setError(`[reloadChat] RPC error: ${err.message}`)
        });
    };

    const scrollToEndOfChat = async () => {
        var div = document.getElementById('messageList');
        if (div) {
            div.scrollTop = div.scrollHeight;
        }
    };

    /* Event handlers */

    const onSubmitAddMessage = (e: SyntheticEvent) => {
        e.preventDefault();
        setError('');
        // Message validation
        const forbiddenWords = ['hello', 'hallo', 'hey', 'hello guys'];
        if (message.length < 3 || forbiddenWords.includes(message.toLowerCase()) ) {
            setChatError(`I'm sure you can come up with something more creative ;)`);
            return;
        }
        // Send transaction
        setWaiting(true);
        console.debug(`[onSubmitAddMessage] Calling chat::add_message on package: ${POLYMEDIA_PACKAGE}`);
        signAndExecuteTransaction({
            kind: 'moveCall',
            data: {
                packageObjectId: POLYMEDIA_PACKAGE,
                module: 'chat',
                function: 'add_message',
                typeArguments: [],
                arguments: [
                    CHAT_ID,
                    Array.from( (new TextEncoder()).encode(message) ),
                ],
                gasBudget: GAS_BUDGET,
            }
        })
        .then((resp: any) => {
            if (resp.effects.status.status == 'success') {
                reloadChat();
                setMessage('');
            } else {
                setError(resp.effects.status.error);
            }
        })
        .catch(error => {
            setError(error.message);
        })
        .finally(() => {
            setWaiting(false);
        });
    };

    /* DEV_ONLY
    const onClickCreateChat = () => {
        console.debug(`[onClickCreateChat] Calling item::create on package: ${POLYMEDIA_PACKAGE}`);
        signAndExecuteTransaction({
            kind: 'moveCall',
            data: {
                packageObjectId: POLYMEDIA_PACKAGE,
                module: 'chat',
                function: 'create',
                typeArguments: [],
                arguments: [
                    100, // max message count
                    512, // max message length
                ],
                gasBudget: GAS_BUDGET,
            }
        })
        .then((resp: any) => {
            if (resp.effects.status.status == 'success') {
                console.debug('[onClickCreateChat] Success:', resp);
                const newObjId = resp.effects.created[0].reference.objectId;
                console.log(`https://explorer.devnet.sui.io/objects/${newObjId}`);
                console.log(newObjId);
            } else {
                setError(resp.effects.status.error);
            }
        })
        .catch(error => {
            setError(error.message);
        });
    };
    */

    /* Render */

    const cssMessageList: Record<any, any> = {
        background: '#37393f',
        color: 'rgb(224, 224, 224)',
        fontSize: '0.85em',
        border: '4px solid black',
        borderRadius: '1em',
        maxHeight: '35em',
        marginBottom: '2em',
        overflowY: 'scroll',
    };
    const cssMessage = {
        padding: '0.8em 1em',
    };

    const cssAuthor = (author_address: string) => {
        let red = parseInt( author_address.slice(2, 4), 16 );
        let green = parseInt( author_address.slice(4, 6), 16 );
        let blue = parseInt( author_address.slice(6, 8), 16 );
        let min_val = 127;
        if (red < min_val)   { red   = 255 - red; }
        if (green < min_val) { green = 255 - green; }
        if (blue < min_val)  { blue  = 255 - blue; }
        return {
            color: `rgb(${red}, ${green}, ${blue})`,
        };
    };

    const MagicAddress = (props: any) => {
        const tooltip = (message: string) => {
            console.debug('[MagicAddress] ' + message);
        };
        const onClick = (e: SyntheticEvent) => {
            e.preventDefault();
            document.getElementById('chat-input')?.focus();
            navigator.clipboard
                .writeText(props.address)
                .then( () => tooltip('Copied!') )
                .catch( (err) => console.error(`[MagicAddress] Error copying to clipboard: ${err}`) );
        };
        return <>
            <a onClick={onClick} style={cssAuthor(props.address)}>
                {'@' + shorten(props.address, 0, 4, '')}
            </a>
        </>;
    };

    const MagicText = (props: any) => {
        const addressRegex = new RegExp(/0x[a-fA-F0-9]+/g);
        const addresses = props.plainText.match(addressRegex) || [];
        const texts = props.plainText.split(addressRegex);

        let key = 0;
        const chunk = (contents: any) => {
            return <React.Fragment key={key++}>{contents}</React.Fragment>;
        };

        let result = [ chunk(texts.shift()) ];
        for (let address of addresses) {
            result.push( chunk(<MagicAddress address={address} />) );
            result.push( chunk(texts.shift()) );
        }
        return <>{result}</>;
    };

    return <div id='page'>

        <h2>CHAT</h2>
        <p>
            A message board to find other players.
            <br/>
            Pro tip: click an address to copy it.
        </p>

        <div id='messageList' style={cssMessageList}>{messages.map((msg: any, idx) =>
            <div key={idx} style={cssMessage}>
                <MagicAddress address={msg.author} />: <MagicText plainText={msg.text} />
            </div>
        )}
        </div>

        <form onSubmit={onSubmitAddMessage} className='button-container'>
            {connected && <>
                <input id='chat-input' type='text' required maxLength={512}
                    className={`nes-input ${waiting ? 'is-disabled' : ''}`} disabled={waiting}
                    spellCheck='false' autoCorrect='off' autoComplete='off'
                    value={message} onChange={e => setMessage(e.target.value)} />
                    {chatError &&
                        <i className='nes-text is-error' style={{fontSize: '0.8em'}}>{chatError}</i>
                    }
                <button type='submit' className={`nes-btn ${waiting ? 'is-disabled' : 'is-primary'}`} disabled={waiting}>
                    {waiting ? 'SENDING' : 'SEND MESSAGE'}
                </button>
            </>}
            <ButtonConnect />
        </form>

        { error && <><br/>ERROR:<br/>{error}</> }

        {/* DEV_ONLY
        <br/> <br/> <hr/> <br/>
        <button onClick={onClickCreateChat}>CREATE NEW CHAT</button>
        <br/> <br/>
        */}

    </div>;
}
