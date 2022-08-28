import React from 'react';

export function Search(props) {
    return <React.Fragment>
        <h2>FIND BET</h2>
        <div>
            <div class='nes-field'>
                <label for='uid_field'>Object ID</label>
                <input type='text' id='uid_field' class='nes-input'
                       spellCheck='false' autoCorrect='off' autoComplete='off'/>
            </div>
            <br/>
            <button type='button' class='nes-btn is-primary'>Search</button>
        </div>
    </React.Fragment>;
}
