import React from 'react';
import { useOutletContext } from 'react-router-dom';

import { ButtonConnect } from './components/ButtonConnect';

export function New(props)
{
    const [connected, setConnected] = useOutletContext();

    return <React.Fragment>

    <h2>NEW BET</h2>
    <div>
        <div className='nes-field'>
            <label htmlFor='title_field'>Bet title</label>
            <input required type='text' id='title_field' className='nes-input'
                   spellCheck='false' autoCorrect='off' autoComplete='off' />
        </div>
        <br/>

        <div className='nes-field'>
            <label htmlFor='description_field'>Description (optional)</label>
            <textarea id="description_field" className="nes-textarea"></textarea>
        </div>
        <br/>

        <label htmlFor='currency_select'>Currency</label>
        <div className='nes-select'>
            <select required id='currency_select' defaultValue='SUI'>
                <option>SUI</option>
            </select>
        </div>
        <br/>

        <div className='nes-field'>
            <label htmlFor='size_field'>Bet size</label>
            <input required type='number' id='size_field' className='nes-input' min='1'
                   spellCheck='false' autoCorrect='off' autoComplete='off' />
        </div>
        <br/>

        <div className='nes-field'>
            <label htmlFor="players_field">Player addresses (2-256)</label>
            <textarea id="players_field" className="nes-textarea"></textarea>
        </div>
        <br/>

        <div className='nes-field'>
        <label htmlFor="judges_field">Judge addresses (1-32)</label>
            <textarea id="judges_field" className="nes-textarea"></textarea>
        </div>
        <br/>

        <div className='nes-field'>
            <label htmlFor='quorum_field'>Quorum (# of votes to win)</label>
            <input required type='number' id='quorum_field' className='nes-input' min='1'
                   spellCheck='false' autoCorrect='off' autoComplete='off' />
        </div>
        <br/>

        {
            connected
            ? <button type='button' className='nes-btn is-primary'>CREATE</button>
            : <ButtonConnect connected={connected} setConnected={setConnected} />
        }
    </div>

    </React.Fragment>;
}
