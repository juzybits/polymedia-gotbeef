import React, { useEffect, useState, SyntheticEvent } from 'react';
import { useNavigate, useOutletContext, Link } from 'react-router-dom';
import { useWallet } from "@mysten/wallet-adapter-react";

import { ButtonConnect } from './components/ButtonConnect';
import { FieldError } from './components/FieldError';
import { GOTBEEF_PACKAGE, GAS_BUDGET, getErrorName } from './lib/sui_tools';
import { isProd } from './lib/common';
import { showConfetti } from './lib/confetti';

export function New()
{
    useEffect(() => {
        document.title = 'Got Beef? - New'
    }, []);

    // Inputs
    const [title, setTitle] = useState(isProd ? '' : 'GCR vs Kwon');
    const [description, setDescription] = useState('');
    const [currency, setCurrency] = useState('0x2::sui::SUI');
    const [size, setSize] = useState(isProd ? '' : 5000);
    const [players, setPlayers] = useState(isProd ? '' : '0x188697360bf5807456322c4eab775613ee5a89db\n0xbf649b108ca5ce32c8b7fa023aa8b39e5bf92715');
    const [judges, setJudges] = useState(isProd ? '' : '0xdc82a911f9bbfc904ffffcf3c7e4cb2b7401bf22');
    const [quorum, setQuorum] = useState(isProd ? '' : 1);

    // Input errors
    const [titleError, setTitleError] = useState('');
    const [sizeError, setSizeError] = useState('');
    const [currencyError, setCurrencyError] = useState('');
    const [playersError, setPlayersError] = useState('');
    const [judgesError, setJudgesError] = useState('');
    const [quorumError, setQuorumError] = useState('');

    // Result
    const [error, setError] = useState('');

    // Parse player and judge addresses
    const addrRegex = /(0x[0-9a-fA-F]{40})/g;
    const playersArray = players.match(addrRegex) || [];
    const judgesArray = judges.match(addrRegex) || [];

    // Calculate minimum and maximum allowed quorum values (as per E_INVALID_QUORUM)
    const minQuorum = 1 + Math.floor(judgesArray.length/2);
    const maxQuorum = judgesArray.length || 1;
    if (quorum < minQuorum) {
        setQuorum(minQuorum);
    } else
    if (quorum > maxQuorum) {
        setQuorum(maxQuorum);
    }

    const validateForm = (): boolean => {
        let valid = true;

        if (title) {
            setTitleError('');
        } else {
            setTitleError('cannot be empty');
            valid = false;
        }

        if (size >= 1) {
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

    const { signAndExecuteTransaction } = useWallet();
    const createBet = async (
        currency: string, // e.g. '0x2::sui::SUI'
        title: string,
        description: string,
        quorum: number,
        size: number,
        players: string[],
        judges: string[],
    ): Promise<SuiTransactionResponse> =>
    {
        console.debug(`[createBet] Calling bet::create on package: ${GOTBEEF_PACKAGE}`);
        return signAndExecuteTransaction({
            kind: 'moveCall',
            data: {
                packageObjectId: GOTBEEF_PACKAGE,
                module: 'bet',
                function: 'create',
                typeArguments: [ currency ],
                arguments: [
                    Array.from( (new TextEncoder()).encode(title) ),
                    Array.from( (new TextEncoder()).encode(description) ),
                    quorum,
                    size,
                    players,
                    judges,
                ],
                gasBudget: GAS_BUDGET,
            }
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
            Math.floor(+size),
            playersArray,
            judgesArray,
        )
        .then((resp: any) => {
            if (resp.effects.status.status == 'success') {
                showConfetti('🥩');
                const newObjId = resp.effects.created[0].reference.objectId;
                navigate('/bet/' + newObjId);
            } else {
                setError( getErrorName(resp.effects.status.error) );
            }
        })
        .catch(error => {
            setError(error.message);
        });
    };

    const { connected } = useWallet();
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
                inputMode='numeric' pattern="[0-9]*"
                value={size}
                onChange={e =>
                    setSize(v => (e.target.validity.valid ? Number(e.target.value) : v))
                }
            />
        </div>
        <FieldError error={sizeError} />

        <div className={`nes-select ${currencyError ? 'is-error' : ''}`} style={{marginTop: '1em'}}>
            <select id='currency_select'
                value={currency} onChange={e => setCurrency(e.target.value)}
            >
                <option disabled value=''>- select -</option>
                <option value='0x2::sui::SUI'>SUI</option>
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

        {connected &&
        <button type='submit' className='nes-btn is-primary' style={{marginRight: '1em'}}>
            CREATE
        </button>}

        <ButtonConnect />
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
