import { useEffect, useState } from 'react';
import '../content/contentList.css';
import './home.css';
import { Route, Routes, useNavigate } from 'react-router-dom';
import { GiHamburgerMenu } from 'react-icons/gi';
import { AiOutlineClose, AiOutlineSearch } from 'react-icons/ai';
import { MdAccountBalanceWallet } from 'react-icons/md';
import CommunityPage from './community';
import CommunityHome from './home';
import { formatDate, shortenWalletAddress } from '../../utils';
import { useSelector } from 'react-redux';

const Community = ({ toggleSidebar }) => {

    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [searchLists, setSearchLists] = useState([]);
    function handleChange(e) { setSearch(e.target.value); };
    const contract = useSelector(state => state.contract);
    const communities = useSelector(state => state.community);

    useEffect(() => {
        // fetch communities data if no session for community
        if(search) {
            const res = [];
            const srch = search.toLowerCase();
            for(const community of communities) {
                let search_related_to = '';
                if(community.creator.toLowerCase().includes(srch)) search_related_to += 'creator, ';
                if(community.name.toLowerCase().includes(srch)) search_related_to += 'name, ';
                if(community.meta_data.niche.toLowerCase().includes(srch)) search_related_to += 'category, ';
                if(community.meta_data.description.toLowerCase().includes(srch)) search_related_to += 'description, ';
                if(community.meta_data.topics.join('').toLowerCase().includes(srch)) search_related_to += 'topics';
                if(search_related_to) {
                    res.push({ 
                        ...community, 
                        search_related_to: search_related_to.endsWith(', ') ? search_related_to.slice(0, -2) : search_related_to
                    });
                }
            }
            setSearchLists(res);
        } else setSearchLists([]);
    }, [search]);

    return (
        <div className="Community">
            <header>
                <GiHamburgerMenu className='community- content-hamburger cursor' onClick={()=>toggleSidebar()} />
                <div className="community- header-search">
                    <div className='hs'>
                        <AiOutlineSearch className={`community- hs-icon ${search?true:false}`} />
                        <input className={`community- hs-input ${search?true:false}`} 
                        value={search||""} placeholder='Search communities...' onChange={(e) => handleChange(e)} />
                        <div className={`community- hs-search-button ${search?true:false} cursor`} onClick={() => setSearch('')}>
                            <AiOutlineClose className='community- hs-icon' />
                        </div>
                    </div>
                </div>
                <div className="community- header-wallet">
                    <MdAccountBalanceWallet className='community- hw-icon' />
                    <span className='community- hw-txt'>{shortenWalletAddress(contract.address||'')||'Wallet'}</span>
                </div>

                <div className={`header-search-dropdown ${searchLists.length > 0 ? true : false}`}>
                    <ul className='hsd-lists'>
                        {searchLists.map((val, idx) => (
                            <li className='hsdl-li' key={`hsdl-${idx}`} 
                            onClick={() => {
                                setSearch('');
                                navigate(`/app/community/page/${val.community_id}`);
                            }}>
                                <span className='hsdl-title'>
                                    Community Name: <span>{val.name}</span>
                                </span>
                                <span className='hsdl-time'>
                                    Created: {formatDate(val.created_at, true)}
                                    {val.search_related_to && <span>{`Search in: [${val.search_related_to}]`}</span>}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            </header>

            <Routes>
                <Route path='/' element={<CommunityHome />} />
                <Route path='/page/:id/*' element={<CommunityPage />} />
            </Routes>

        </div>
    );
};

export default Community;