import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { App } from './js/App';
import { Home } from './js/Home';
import { New } from './js/New';
import { NotFound } from './js/NotFound';
import { Find } from './js/Find';
import { View } from './js/View';

ReactDOM
    .createRoot( document.getElementById('app') )
    .render(
        <BrowserRouter>
        <Routes>
            <Route path='/' element={<App />} >
                <Route index element={<Home />} />
                <Route path='new' element={<New />} />
                <Route path='find' element={<Find />} />
                <Route path='bet/:uid' element={<View />} />
                <Route path='*' element={<NotFound />} />
            </Route>
        </Routes>
        </BrowserRouter>
    );
