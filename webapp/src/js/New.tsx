import React, { useEffect, useState } from 'react';
import { useNavigate, useOutletContext, Link } from 'react-router-dom';

import { createBet, getErrorName } from './lib/sui_tools';
import { showConfetti } from './lib/common';
import { ButtonConnect } from './components/ButtonConnect';
import { FieldError } from './components/FieldError';

export function New()
{
    useEffect(() => { document.title = 'Got Beef? - New' }, []);

    const [connected, setConnected] = useOutletContext();

    // Inputs
    const [title, setTitle] = useState('Ali vs Frazier');
    const [description, setDescription] = useState('');
    const [currency, setCurrency] = useState('0x2::sui::SUI');
    const [size, setSize] = useState(5000);
    const [players, setPlayers] = useState('0xaa6a2aef59cb467868296418e949d7cca4d24a51\n0xb3b72b98dc693f8e8524cf9118ccb0c03d51618e');
    const [judges, setJudges] = useState('0x4cc30fff19e8d4fd798a47042c213b38b6fbb80d');
    const [quorum, setQuorum] = useState(1);
    // Input errors
    const [titleError, setTitleError] = useState('');
    const [sizeError, setSizeError] = useState('');
    const [currencyError, setCurrencyError] = useState('');
    const [playersError, setPlayersError] = useState('');
    const [judgesError, setJudgesError] = useState('');
    const [quorumError, setQuorumError] = useState('');

    // Result
    const [newObjId, setNewObjId] = useState(undefined);
    const [error, setError] = useState(undefined);

    // Parse player and judge addresses
    const addrRegex = /(0x[0-9a-fA-F]+)/g;
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

    const validateForm = (): bool => {
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
            setJudgesError('too many players (maximum is 32)');
            valid = false;
        } else {
            setJudgesError('');
        }

        return valid;
    };
    const navigate = useNavigate();
    const onSubmitCreate = (e) => {
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
            quorum,
            size,
            playersArray,
            judgesArray,
        )
        .then(resp => {
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

    return <React.Fragment>

    <h2>NEW BET</h2>

    <form onSubmit={onSubmitCreate}>
        <div className='nes-field'>
            <label htmlFor='title_field'>Title</label>
            <input type='text' id='title_field' className={`nes-input ${titleError ? 'is-error' : ''}`}
                spellCheck='false' autoCorrect='off' autoComplete='off'
                value={title} onChange={(e) => setTitle(e.target.value)}
            />
        </div>
        <FieldError error={titleError} />

        <div className='nes-field'>
            <label htmlFor='description_field'>Description (optional)</label>
            <textarea id='description_field' className='nes-textarea'
                value={description} onChange={(e) => setDescription(e.target.value)}
            ></textarea>
        </div>

        <div className='nes-field'>
            <label htmlFor='size_field'><i className='nes-icon coin is-custom' /> Size and currency</label>
            <input type='number' id='size_field' className={`nes-input ${sizeError ? 'is-error' : ''}`}
                spellCheck='false' autoCorrect='off' autoComplete='off'
                value={size} onChange={(e) => setSize(e.target.value)}
            />
        </div>
        <FieldError error={sizeError} />

        <div className={`nes-select ${currencyError ? 'is-error' : ''}`} style={{marginTop: '1em'}}>
            <select id='currency_select'
                value={currency} onChange={(e) => setCurrency(e.target.value)}
            >
                <option disabled value=''>- select -</option>
                <option value='0x2::sui::SUI'>SUI</option>
            </select>
        </div>
        <FieldError error={currencyError} />

        <div className='nes-field'>
            <label htmlFor='players_field'> <i className='snes-jp-logo custom-logo' /> Player addresses (2—256)</label>
            <textarea id='players_field' className={`nes-textarea ${playersError ? 'is-error' : ''}`}
                value={players} onChange={(e) => setPlayers(e.target.value)}
            ></textarea>
        </div>
        <FieldError error={playersError} />
        <label className='field-note'>(found {playersArray.length})</label>

        <div className='nes-field'>
        <label htmlFor='judges_field'><i className='nes-logo custom-logo' /> Judge addresses (1—32)</label>
            <textarea id='judges_field' className={`nes-textarea ${judgesError ? 'is-error' : ''}`}
                value={judges} onChange={(e) => setJudges(e.target.value)}
            ></textarea>
        </div>
        <FieldError error={judgesError} />
        <label className='field-note'>(found {judgesArray.length})</label>

        <div className='nes-field'>
            <label htmlFor='quorum_field'><i className='nes-icon trophy is-custom' /> Quorum (# of votes to win)</label>
            <input type='number' id='quorum_field' className='nes-input' min={minQuorum} max={maxQuorum}
                spellCheck='false' autoCorrect='off' autoComplete='off'
                value={quorum} onChange={(e) => setQuorum(e.target.value)}
            />
        </div>
        <label className='field-note'>(minimum {minQuorum}/{maxQuorum})</label>

        <br/>
        <br/>

        {
            connected
            ? <button type='input' className='nes-btn is-primary'>CREATE</button>
            : <ButtonConnect connected={connected} setConnected={setConnected} />
        }
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
