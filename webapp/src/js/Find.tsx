import React from 'react';
import { SuiToolsContext } from './App';

export class Find extends React.Component {

    static contextType = SuiToolsContext;

    constructor(props) {
        super(props);
    }

    componentDidMount() {
        this.foo();
        // this.context.testSdk();
        // this.context.testWalletAdapter();
    }

    async foo(wallet) {
        console.log('Connected:', await this.context.isConnected());
    }

    render() {
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
}
