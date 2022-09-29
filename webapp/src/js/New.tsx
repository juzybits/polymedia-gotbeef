import React, { useEffect, useState } from 'react';
import { useNavigate, useOutletContext, Link } from 'react-router-dom';

import { createBet, getErrorName } from './lib/sui_tools';
import { showConfetti } from './lib/common';
import { ButtonConnect } from './components/ButtonConnect';

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

    // Result
    const [newObjId, setNewObjId] = useState(undefined);
    const [error, setError] = useState(undefined);

    // Parse player and judge addresses
    const addr_regex = /(0x[0-9a-fA-F]+)/g;
    const player_array = players.match(addr_regex) || [];
    const judge_array = judges.match(addr_regex) || [];

    // Calculate minimum and maximum allowed quorum values (as per E_INVALID_QUORUM)
    const min_quorum = 1 + Math.floor(judge_array.length/2);
    const max_quorum = judge_array.length || 1;
    if (quorum < min_quorum) {
        setQuorum(min_quorum);
    } else
    if (quorum > max_quorum) {
        setQuorum(max_quorum);
    }

    const navigate = useNavigate();
    const onSubmitCreate = (e) => { // TODO: validate inputs
        e.preventDefault();
        createBet(
            currency,
            title,
            description,
            quorum,
            size,
            player_array,
            judge_array,
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
            <input required type='text' id='title_field' className='nes-input'
                spellCheck='false' autoCorrect='off' autoComplete='off'
                value={title} onChange={(e) => setTitle(e.target.value)}
            />
        </div>

        <div className='nes-field'>
            <label htmlFor='description_field'>Description (optional)</label>
            <textarea id='description_field' className='nes-textarea'
                value={description} onChange={(e) => setDescription(e.target.value)}
            ></textarea>
        </div>

        <div className='nes-field'>
            <label htmlFor='size_field'><i className='nes-icon coin is-custom' /> Size and currency</label>
            <input required type='number' id='size_field' className='nes-input' min='1'
                spellCheck='false' autoCorrect='off' autoComplete='off'
                value={size} onChange={(e) => setSize(e.target.value)}
            />
        </div>
        <div className='nes-select' style={{marginTop: '1em'}}>
            <select required id='currency_select'
                value={currency} onChange={(e) => setCurrency(e.target.value)}
            >
                <option value='0x2::sui::SUI'>SUI</option>
            </select>
        </div>

        <div className='nes-field'>
            <label htmlFor='players_field'> <i className='snes-jp-logo custom-logo' /> Player addresses (2—256)</label>
            <textarea id='players_field' className='nes-textarea'
                value={players} onChange={(e) => setPlayers(e.target.value)}
            ></textarea>
        </div>
        <label className='field-note'>(found {player_array.length})</label>

        <div className='nes-field'>
        <label htmlFor='judges_field'><i className='nes-logo custom-logo' /> Judge addresses (1—32)</label>
            <textarea id='judges_field' className='nes-textarea'
                value={judges} onChange={(e) => setJudges(e.target.value)}
            ></textarea>
        </div>
        <label className='field-note'>(found {judge_array.length})</label>

        <div className='nes-field'>
            <label htmlFor='quorum_field'><i className='nes-icon trophy is-custom' /> Quorum (# of votes to win)</label>
            <input required type='number' id='quorum_field' className='nes-input' min={min_quorum} max={max_quorum}
                spellCheck='false' autoCorrect='off' autoComplete='off'
                value={quorum} onChange={(e) => setQuorum(e.target.value)}
            />
        </div>
        <label className='field-note'>(minimum {min_quorum}/{max_quorum})</label>

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
