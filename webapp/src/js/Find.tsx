import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { getObject, isBetObject } from './lib/sui_tools';

export function Find()
{
    useEffect(() => { document.title = 'got beef? - Find' }, []);

    const [betId, setbetId] = useState('0x508208ac45f4c91d3875bd71441815d1fe7847fc');
    const [data, setData] = useState(undefined);

    const navigate = useNavigate();
    const onSubmitSearch = (e) => {
        e.preventDefault();
        getObject(betId)
        .then(bet => {
            if (isBetObject(bet)) {
                navigate('/bet/' + bet.details.reference.objectId, {
                    state: { data: bet.details.data.fields }
                });
                setData(bet.details.data.fields);
                console.debug('[find] Found Bet object:', bet);
            } else {
                setData(null);
                console.warn('[find] Bet object not found. Response:', bet);
            }
        })
        .catch(error => {
            setData(null);
            console.warn('[find] RPC error:', error.message);
        });
    };

    const makeErrorHtml = () => {
        if (data !== null) {
            return '';
        }
        return <React.Fragment>
            <br/>
            <br/>
            <h2>Error</h2>
            Bet not found.
        </React.Fragment>
    }

    return <React.Fragment>

        <h2>FIND BET</h2>

        <form onSubmit={onSubmitSearch}>

            <div className='nes-field'>
                <label htmlFor='uid_field'>Object ID</label>
                <input type='text' id='uid_field' className='nes-input'
                    spellCheck='false' autoCorrect='off' autoComplete='off'
                    value={betId} onChange={(e) => setbetId(e.target.value)}
               />
            </div>
            <br/>

            <button type='submit' className='nes-btn is-primary'>Search</button>

            { makeErrorHtml() }

        </form>

    </React.Fragment>;
}
