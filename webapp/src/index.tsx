import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { App } from './js/App';
import { Cancel } from './js/Cancel';
import { Fund } from './js/Fund';
import { Home } from './js/Home';
import { New } from './js/New';
import { NotFound } from './js/NotFound';
import { Search } from './js/Search';
import { View } from './js/View';
import { Vote } from './js/Vote';

ReactDOM
    .createRoot( document.getElementById('app') )
    .render(
        <BrowserRouter>
        <Routes>
            <Route path='/' element={<App />} >
                <Route index element={<Home />} />
                <Route path='new' element={<New />} />
                <Route path='search' element={<Search />} />
                <Route path='bet/:uid'>
                    <Route index element={<View />} />
                    <Route path='fund' element={<Fund />} />
                    <Route path='vote' element={<Vote />} />
                    <Route path='cancel' element={<Cancel />} />
                </Route>
                <Route path='*' element={<NotFound />} />
            </Route>
        </Routes>
        </BrowserRouter>
    );
