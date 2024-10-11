import { useEffect, useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { AiOutlineClose, AiOutlineSearch } from 'react-icons/ai';
import { MdAccountBalanceWallet } from 'react-icons/md';
import './contentList.css';
import Content from './content';
import Contentlist from './contentList';
import PostModal from './postModal';
import { GiHamburgerMenu } from 'react-icons/gi';
import { useSelector } from 'react-redux';
import { formatDate, shortenWalletAddress } from '../../utils';

const ContentList = ({ toggleSidebar }) => {

    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [searchLists, setSearchLists] = useState([]);
    const [modal, setModal] = useState(false);
    const contract = useSelector(state => state.contract);
    const contents = useSelector(state => state.contents);

    function closeModal() { setModal(false); }
    function openModal() { setModal(true); }
    function handleChange(e) { setSearch(e.target.value); };

    useEffect(() => {
        if(search) {
            const res = [];
            const srch = search.toLowerCase();
            for(const content of contents) {
                let search_related_to = '';
                if(content.author.toLowerCase().includes(srch)) search_related_to += 'author, ';
                if(content.sub_data.title.toLowerCase().includes(srch)) search_related_to += 'title, ';
                if(content.sub_data.content.toLowerCase().includes(srch)) search_related_to += 'content, ';
                if(content.sub_data.tags.join('').toLowerCase().includes(srch)) search_related_to += 'tags';
                if(search_related_to) {
                    res.push({ 
                        ...content, 
                        search_related_to: search_related_to.endsWith(', ') ? search_related_to.slice(0, -2) : search_related_to
                    });
                }
            }
            setSearchLists(res);
        } else setSearchLists([]);
    }, [search]);

    return (
        <div className='content-list'>
            <header>
                <GiHamburgerMenu className='content-hamburger cursor' onClick={()=>toggleSidebar()} />
                <div className="header-search">
                    <div className='hs'>
                        <AiOutlineSearch className={`hs-icon ${search?true:false}`} />
                        <input className={`hs-input ${search?true:false}`} 
                        value={search||""} placeholder='Search...' onChange={(e) => handleChange(e)} />
                        <div className={`hs-search-button ${search?true:false} cursor`} onClick={() => setSearch('')}>
                            <AiOutlineClose className='hs-icon' />
                        </div>
                    </div>
                </div>
                <div className="header-wallet">
                    <MdAccountBalanceWallet className='hw-icon' />
                    <span className='hw-txt'>{shortenWalletAddress(contract.address||'')||'Wallet'}</span>
                </div>

                <div className={`header-search-dropdown ${searchLists.length > 0 ? true : false}`}>
                    <ul className='hsd-lists'>
                        {searchLists.map((val, idx) => (
                            <li className='hsdl-li' key={`hsdl-${idx}`} onClick={() => {
                                setSearch('');
                                navigate(`/app/post/${val.content_id}`);
                            }}>
                                <span className='hsdl-title'>
                                    Post title: <span>{val.sub_data.title}</span>
                                </span>
                                <span className='hsdl-time'>
                                    Posted: {formatDate(val.timestamp, true)}
                                    {val.search_related_to && <span>{`Search in: [${val.search_related_to}]`}</span>}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            </header>
            <Routes>
                <Route path='/' element={<Contentlist openModal={openModal} />} />
                <Route path='/post/:id' element={<Content />} />
            </Routes>
            
            {modal && <PostModal closeModal={closeModal} />}
        </div>
    );
};

export default ContentList;