import React from 'react';

export function Find(props) {
    return <React.Fragment>
        <h2>FIND BET</h2>
        <div>
            <div className='nes-field'>
                <label htmlFor='uid_field'>Object ID</label>
                <input type='text' id='uid_field' className='nes-input'
                       spellCheck='false' autoCorrect='off' autoComplete='off'/>
            </div>
            <br/>
            <button type='button' className='nes-btn is-primary'>Search</button>
        </div>
    </React.Fragment>;
}
