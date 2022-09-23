import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { getBet } from './lib/sui_tools';

export function Find()
{
    useEffect(() => { document.title = 'got beef? - Find' }, []);

    const [betId, setbetId] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const onSubmitSearch = (e) => {
        e.preventDefault();
        getBet(betId)
        .then(obj => {
            let isBetType = obj.details.data.type.match(/^0x.+::bet::Bet<0x.+::.+::.+>$/);
            if (!isBetType) {
                setError('Wrong object type: ' + obj.details.data.type);
            } else {
                // TODO: preserve `obj` so /bet/:uid doesn't need to fetch it again
                navigate('/bet/' + obj.details.reference.objectId);
            }
        })
        .catch(error => {
            setError('Object not found');
        });
    };

    const makeErrorHtml = () => {
        if (!error)
            return '';

        return <React.Fragment>
            <br/>
            <br/>
            <h2>Error</h2>
            {error}
        </React.Fragment>;
    };

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
