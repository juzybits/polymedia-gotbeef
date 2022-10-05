import React from 'react';

import bucko from '../img/bucko.png';

export function NotFound(props) {
    return <React.Fragment>
        <h2>404</h2>
        <div>
            <img id='bucko' src={bucko} alt='Not found, bucko!' />
        </div>
    </React.Fragment>;
}
