import React, { useEffect, useState, SyntheticEvent } from 'react';
import { useWallet } from '@mysten/wallet-adapter-react';
import { ButtonConnect } from './components/ButtonConnect';
import { shorten } from './lib/common';
import { rpc } from './lib/sui_tools';

export function Chat(props: any)
{
    const POLYMEDIA_PACKAGE = '0x7e65241d33f2524cc6610bd41a1ae0466aa3068b';
    const CHAT_ID = '0x564d45ee3fc2e4b0a98cd5087e2c6480e2057f17';
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
        const forbiddenWords = ['hello', 'hallo', 'hello guys'];
        if (message.length < 4 || forbiddenWords.includes(message.toLowerCase()) ) {
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
                    Date.now(),
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

    /// Shorten a 0x address, style it, and make it clickable
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

    /// Parse plaintext and format the 0x addresses in it
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
            <span style={{fontSize: '0.8em', color: '#333'}}>Pro tip #1: click an address to copy it.</span>
            <br/>
            <span style={{fontSize: '0.8em', color: '#333'}}>Pro tip #2: paste an address to link it.</span>
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

    </div>;
}
