import { Routes, Route } from 'react-router-dom';
import './voting.css';
import Sidebar from './sidebar';
import ContentList from './pages/content';
import Profile from './pages/profile';
import Wallet from './pages/wallet';
import { useState } from 'react';
import Community from './pages/community';

const VotingApp = () => {

    const [showSidebar, setShowSidebar] = useState(window.innerWidth > 500 ? true : false);

    const toggleSidebar = () => {
        setShowSidebar(!showSidebar);
    };

    return (
        <div className='voting-app-wrapper'>
            <div className='voting-app'>
                <aside className={`voting-side ${showSidebar}`}>
                    <Sidebar toggleSidebar={toggleSidebar} setShowSidebar={setShowSidebar} />
                </aside>
                <main className={`voting-main ${showSidebar}`}>
                    <Routes>
                        <Route path='/*' element={<ContentList toggleSidebar={toggleSidebar} />} />
                        <Route path='/profile/*' element={<Profile toggleSidebar={toggleSidebar} />} />
                        <Route path='/wallet' element={<Wallet toggleSidebar={toggleSidebar} />} />
                        <Route path='/community/*' element={<Community toggleSidebar={toggleSidebar} />} />
                    </Routes>
                </main>
            </div>
        </div>
    );
};

export default VotingApp;