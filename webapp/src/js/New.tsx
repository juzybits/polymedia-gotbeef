import React from 'react';

export function New(props) {
    return <React.Fragment>
        <h2>NEW BET</h2>
        <div>
            <div class='nes-field'>
                <label for='title_field'>Bet title</label>
                <input required type='text' id='title_field' class='nes-input'
                       spellCheck='false' autoCorrect='off' autoComplete='off' />
            </div>
            <br/>

            <div class='nes-field'>
                <label for='description_field'>Description (optional)</label>
                <input type='text' id='description_field' class='nes-input'
                       spellCheck='false' autoCorrect='off' autoComplete='off' />
            </div>
            <br/>

            <label for='currency_select'>Currency</label>
            <div class='nes-select'>
                <select required id='currency_select'>
                    <option selected value='SUI'>SUI</option>
                </select>
            </div>
            <br/>

            <div class='nes-field'>
                <label for='size_field'>Bet size</label>
                <input required type='number' id='size_field' class='nes-input' min='1'
                       spellCheck='false' autoCorrect='off' autoComplete='off' />
            </div>
            <br/>

            <div class='nes-field'>
                <label for="players_field">Player addresses (2-256)</label>
                <textarea id="players_field" class="nes-textarea"></textarea>
            </div>
            <br/>

            <div class='nes-field'>
            <label for="judges_field">Judge addresses (1-32)</label>
                <textarea id="judges_field" class="nes-textarea"></textarea>
            </div>
            <br/>

            <div class='nes-field'>
                <label for='quorum_field'>Quorum (# of votes to win)</label>
                <input required type='number' id='quorum_field' class='nes-input' min='1'
                       spellCheck='false' autoCorrect='off' autoComplete='off' />
            </div>
            <br/>

            <button type='button' class='nes-btn is-primary'>CREATE</button>

        </div>
    </React.Fragment>;
}
