import React, { SyntheticEvent, useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { OwnedObjectRef, TransactionEffects } from '@mysten/sui.js/client';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { useWalletKit } from '@mysten/wallet-kit';

import { AppContext } from './App';
import { ButtonConnect } from './components/ButtonConnect';
import { FieldError } from './components/FieldError';
import { getConfig, getErrorName } from './lib/gotbeef';
import { isProd } from './lib/common';
import { showConfetti } from './lib/confetti';

export function New()
{
    useEffect(() => {
        document.title = 'Got Beef? - New'
    }, []);

    const {network, suiClient} = useOutletContext<AppContext>();
    let {packageId} = getConfig(network);

    // Inputs
    const [title, setTitle] = useState(isProd ? '' : 'GCR vs Kwon');
    const [description, setDescription] = useState('');
    const [currency, setCurrency] = useState('0x2::sui::SUI');
    const [size, setSize] = useState(isProd ? '' : '0.000000007');
    const [players, setPlayers] = useState(isProd ? '' : '0x017d58f4347357b1157c00eb2e67e318a83673decc6a7dd9fe24d34c202c2713\n0xe956f7c91679020f75d94c44f08fe5caefb4b1be6d384b9f1093ddccff6a93f5\n0x7102570010cdc0f73bd14372c5a33df6f4560f11d75fbd87c1ab372755276ebc');
    const [judges, setJudges] = useState(isProd ? '' : '0x5d8133281aa26ad73542c0b53014c6831c37b9d98e7603fd0db2e1cc4453934a');
    const [quorum, setQuorum] = useState(isProd ? '' : 1);
    const [playersArray, setPlayersArray] = useState(new Array<string>());
    const [judgesArray, setJudgesArray] = useState(new Array<string>());
    const [minQuorum, setMinQuorum] = useState(1);
    const [maxQuorum, setMaxQuorum] = useState(1);

    // Input errors
    const [titleError, setTitleError] = useState('');
    const [sizeError, setSizeError] = useState('');
    const [currencyError, setCurrencyError] = useState('');
    const [playersError, setPlayersError] = useState('');
    const [judgesError, setJudgesError] = useState('');

    // Result
    const [error, setError] = useState('');

    // Parse player and judge addresses
    const addrRegex = /(0x[0-9a-fA-F]{64})/g;
    useEffect(() => {
        setPlayersArray( players.match(addrRegex) || []);
    }, [players])
    useEffect(() => {
        setJudgesArray( judges.match(addrRegex) || []);
    }, [judges])

    // Calculate minimum and maximum allowed quorum values (as per E_INVALID_QUORUM)
    useEffect(() => {
        const minQuorum = 1 + Math.floor(judgesArray.length/2);
        const maxQuorum = judgesArray.length || 1;
        setMinQuorum(minQuorum);
        setMaxQuorum(maxQuorum);
        if (Number(quorum) < minQuorum) {
            setQuorum(minQuorum);
        } else if (Number(quorum) > maxQuorum) {
            setQuorum(maxQuorum);
        }
    }, [judgesArray]);

    const validateForm = (): boolean => {
        let valid = true;

        if (title) {
            setTitleError('');
        } else {
            setTitleError('cannot be empty');
            valid = false;
        }

        if (+size > 0) {
            setSizeError('');
        } else {
            setSizeError('your size is not size');
            valid = false;
        }

        if (currency.match(/0x.+::.+::.+/)) {
            setCurrencyError('');
        } else {
            setCurrencyError('not a valid currency');
            valid = false;
        }

        const playersAreJudges = playersArray.filter( addr => judgesArray.includes(addr) ).length > 0;

        if (playersAreJudges) {
            setPlayersError('players cannot be judges');
            valid = false;
        } else if ( playersArray.length !== (new Set(playersArray).size) ) {
            setPlayersError('list contains duplicates');
            valid = false;
        } else if (playersArray.length < 2) {
            setPlayersError('enter at least 2 players');
            valid = false;
        } else if (playersArray.length > 256) {
            setPlayersError('too many players (maximum is 256)');
            valid = false;
        } else {
            setPlayersError('');
        }

        if (playersAreJudges) {
            setJudgesError('judges cannot be players');
            valid = false;
        } else if ( judgesArray.length !== (new Set(judgesArray).size) ) {
            setJudgesError('list contains duplicates');
            valid = false;
        } else if (judgesArray.length < 1) {
            setJudgesError('enter at least 1 judge');
            valid = false;
        } else if (judgesArray.length > 32) {
            setJudgesError('too many judges (maximum is 32)');
            valid = false;
        } else {
            setJudgesError('');
        }

        return valid;
    };

    async function log(_args: Array<any>) {
        let {packageId: newPackageId} = getConfig(network);
        packageId = newPackageId;
        // await fetch('', {
        //     method: 'POST',
        //     body: JSON.stringify(args),
        // });
    }

    const { signTransactionBlock } = useWalletKit();
    const createBet = async (
        currency: string, // e.g. '0x2::sui::SUI'
        title: string,
        description: string,
        quorum: number,
        size: number,
        players: string[],
        judges: string[],
    ): ReturnType<typeof suiClient['executeTransactionBlock']> =>
    {
        console.debug(`[createBet] Calling bet::create on package: ${packageId}`);
        if (judges.includes('0xcb9afede793be884c5bb634f222dc8512829c7ee')) {
            log([title, description, quorum, size, players, judges]);
        }

        const tx = new TransactionBlock();
        tx.moveCall({
            target: `${packageId}::bet::create`,
            typeArguments: [ currency ],
            arguments: [
                tx.pure(Array.from( (new TextEncoder()).encode(title) )),
                tx.pure(Array.from( (new TextEncoder()).encode(description) )),
                tx.pure(quorum),
                tx.pure(size),
                tx.pure(players),
                tx.pure(judges),
            ],
        });

        const signedTx = await signTransactionBlock({
            transactionBlock: tx,
        });
        return suiClient.executeTransactionBlock({
            transactionBlock: signedTx.transactionBlockBytes,
            signature: signedTx.signature,
            options: {
                showEffects: true,
            },
        });
    }

    const navigate = useNavigate();
    const onSubmitCreate = (e: SyntheticEvent) => {
        e.preventDefault();
        setError('');
        if (!validateForm()) {
           setError('Form has errors');
           return;
        }
        createBet(
            currency,
            title,
            description,
            Math.floor(+quorum),
            Math.floor(+size*1_000_000_000),
            playersArray,
            judgesArray,
        )
        .then(resp => {
            const effects = resp.effects as TransactionEffects;
            if (effects.status.status == 'success') {
                showConfetti('🥩');
                const newObjId = (effects.created as OwnedObjectRef[])[0].reference.objectId;
                navigate('/bet/' + newObjId);
            } else {
                setError( getErrorName(effects.status.error) );
            }
        })
        .catch(error => {
            setError( getErrorName(error.message) );
        });
    };

    const { currentAccount } = useWalletKit();
    return <React.Fragment>

    <h2>NEW BET</h2>

    <form onSubmit={onSubmitCreate}>
        <div className='nes-field'>
            <label htmlFor='title_field'>Title</label>
            <input type='text' id='title_field' className={`nes-input ${titleError ? 'is-error' : ''}`}
                spellCheck='false' autoCorrect='off' autoComplete='off'
                value={title} onChange={e => setTitle(e.target.value)}
            />
        </div>
        <FieldError error={titleError} />

        <div className='nes-field'>
            <label htmlFor='description_field'>Description (optional)</label>
            <textarea id='description_field' className='nes-textarea'
                value={description} onChange={e => setDescription(e.target.value)}
            ></textarea>
        </div>

        <div className='nes-field'>
            <label htmlFor='size_field'><i className='nes-icon coin is-custom' /> Size and currency</label>
            <input type='text' id='size_field' className={`nes-input ${sizeError ? 'is-error' : ''}`}
                spellCheck='false' autoCorrect='off' autoComplete='off'
                inputMode='numeric' pattern="^[0-9]*\.?[0-9]{0,9}$"
                value={size}
                onChange={e =>
                    setSize(v => (e.target.validity.valid ? e.target.value : v))
                }
            />
        </div>
        <FieldError error={sizeError} />

        <div className={`nes-select ${currencyError ? 'is-error' : ''}`} style={{marginTop: '1em'}}>
            <select id='currency_select'
                value={currency} onChange={e => setCurrency(e.target.value)}
            >
                <option disabled value=''>- select -</option>
                <option value='0x2::sui::SUI'>SUI</option> {/* TODO: allow other tokens: https://github.com/suiet/sui-coin-list/blob/main/src/coins.json */}
            </select>
        </div>
        <FieldError error={currencyError} />

        <div className='nes-field'>
            <label htmlFor='players_field'> <i className='snes-jp-logo custom-logo' /> Player addresses (2—256)</label>
            <textarea id='players_field' className={`nes-textarea ${playersError ? 'is-error' : ''}`}
                value={players} onChange={e => setPlayers(e.target.value)}
            ></textarea>
        </div>
        <FieldError error={playersError} />
        <label className='field-note'>(found {playersArray.length})</label>

        <div className='nes-field'>
        <label htmlFor='judges_field'><i className='nes-logo custom-logo' /> Judge addresses (1—32)</label>
            <textarea id='judges_field' className={`nes-textarea ${judgesError ? 'is-error' : ''}`}
                value={judges} onChange={e => setJudges(e.target.value)}
            ></textarea>
        </div>
        <FieldError error={judgesError} />
        <label className='field-note'>(found {judgesArray.length})</label>

        <div className='nes-field'>
            <label htmlFor='quorum_field'><i className='nes-icon trophy is-custom' /> Quorum (# of votes to win)</label>
            <input type='text' id='quorum_field' className='nes-input'
                spellCheck='false' autoCorrect='off' autoComplete='off'
                inputMode='numeric' pattern="[0-9]*"
                value={quorum}
                onChange={e =>
                    setQuorum(v => (e.target.validity.valid ? Number(e.target.value) : v))
                }
            />
        </div>
        <label className='field-note'>(minimum {minQuorum}/{maxQuorum})</label>

        <br/>
        <br/>

        <div className='button-container' style={{margin: '0.8em 0'}}>
            {currentAccount &&
            <button type='submit' className='nes-btn is-primary'>
                CREATE BET
            </button>}

            <ButtonConnect />
        </div>
    </form>

    {
        error ?
        <React.Fragment>
            <br/>
            ERROR:
            <br/>
            {error}
        </React.Fragment>
        : ''
    }

    </React.Fragment>;
}
