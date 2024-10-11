import { useEffect, useRef, useState } from 'react';
import { FaPlus } from 'react-icons/fa6';
import './community.css';
import SkeletonLoader from '../../component/skeleton';
import CommunityLoading from './load';
import { useDispatch, useSelector } from 'react-redux';
import { Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { amountShort, formatDate, inProductionContent, parseCommunityData, parseContentData, setMessageFn } from '../../utils';
import { 
    createCommunitiesContractInstance, createContentContractInstance, createUserContractInstance 
} from '../../services/contracts_creators';
import ErrorPage from '../../component/error';
import { setMessage } from '../../store/message';
import { bindActionCreators } from 'redux';
import CommunityPageHome from './community_home';
import CommunityContent from './community_content';
import CommunityPostModal from './postModal';
import community_image from '../../images/community.jpg';

const CommunityPage = ({ toggleSidebar }) => {

    const [route, setRoute] = useState('Feed');
    const [modal, setModal] = useState(false);
    const [loading, setLoading] = useState('fetching');
    const [feeds, setFeeds] = useState([]);
    const [error, setError] = useState(false);
    const [community, setCommunity] = useState({});
    const [joinLoading, setJoinLoading] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const scrolledRef = useRef(false);

    const { id, content_id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const setMessageData = bindActionCreators(setMessage, dispatch);
    const sessions = useSelector(state => state.sessions);
    const contract = useSelector(state => state.contract);
    const cmt = useSelector(state => state.community).find(val => val.community_id == id);
    const cmtRef = useRef(cmt);

    const communityError = 'Sorry, there is no community like this.';

    function closeModal() { setModal(false); }

    const fetchFeeds = async () => {
        setError(false);
        const communityContractInstance = await createCommunitiesContractInstance(contract.signer);
        const isMember = await communityContractInstance.isAMember(id-0, contract.address);
        
        // use cmt below cus setCommunity might have not updated commuity data by now
        setCommunity({ ...cmtRef.current, isMember });
        const contentContractInstance = await createContentContractInstance(contract.signer);
        const res = await contentContractInstance.getContentList(id-0);
        const data = [];
        const userContractInstance = await createUserContractInstance(contract.signer);
        for(const response of Array.from(res).reverse()) {
            if(!inProductionContent(response)) continue;
            const value = parseContentData(response);
            const author = await userContractInstance.getUsername(value.author);
            const votes = await contentContractInstance.getTotalVotes(value.content_id-0);
            data.push({ ...value, author, votes, author_id: value.author });
        }
        setFeeds(data);
        setLoading(false);
    };

    const fetchCommunity = async () => {
        setError(false);
        setLoading('fetching');
        try {
            if(!contract.signer) return setError(true);

            const communityContractInstance = await createCommunitiesContractInstance(contract.signer);
            const cmmt = await communityContractInstance.getCommunity(id-0);
            if(!cmmt) {
                setError(communityError);
                setLoading(false);
                return;
            }
            const cmmty = parseCommunityData(cmmt);
            const userContractInstance = await createUserContractInstance(contract.signer);
            const creator = await userContractInstance.getUsername(cmmty.creator);
            cmtRef.current = { ...cmmty, creator, community_id: id };
            setCommunity({ ...cmmty, creator, community_id: id });
            await fetchFeeds();
            setLoading(false);
        } catch (err) {
            setError('Error fetching data. Check internet and try again.');
            setLoading(false);
        }
    };

    useEffect(() => {
        if(sessions.community) {
            if(!cmt) fetchCommunity();
            else {
                cmtRef.current = cmt;
                setCommunity(cmt);
                setLoading(true);
                fetchFeeds().catch(err => setError(true));
            }
        } else fetchCommunity();
    }, []);

    const dummy = Array(6).fill(0);

    const handleJoin = async () => {
        if(joinLoading) return setMessageFn(setMessageData, { status: 'error', message: 'Already making a request.'});
        
        setJoinLoading(true);
        try {
            const contractInstance = await createCommunitiesContractInstance(contract.signer);
            await contractInstance.addUserToCommunity(id-0);
            setMessageFn(setMessage, { status: 'success', message: 'Successfully joined this community'});
            setCommunity({ ...community, isMember: true });
            setJoinLoading(false);
        } catch (err) {
            setJoinLoading(false);
            setMessageFn(setMessage, { status: 'error', message: 'Error with request. Check internet and try again.'});
        }
    };

    const handleScroll = (e) => {
        const { scrollTop } = e.target;
        if(scrollTop > 100) {
            if(!scrolledRef.current) {
                setScrolled(true);
                scrolledRef.current = true;
            }
        } else {
            if(scrolledRef.current) {
                setScrolled(false);
                scrolledRef.current = false;
            }
        }
    };

    return (
        <div className='community-Page'>
        {
            error && !community.creator ?

            <div className='cp-error'>
                <ErrorPage text={error === communityError ? error : ''} 
                    important={true} btnName={error === communityError ? 'Go back to community page.' : ''}
                    refreshFn={() => {
                        if(error === communityError) return navigate('/app/community');
                        fetchCommunity();
                    }} 
                />
            </div> :

            loading === 'fetching' ?

            <CommunityLoading /> :

            <div className='community' onScroll={(e) => handleScroll(e)}>
                <div className={`ch positioned ${scrolled}`}>
                    <div className='ch-img'>
                        {community.meta_data.profile_url && <img src={community.meta_data.profile_url} alt='avatar' />}
                    </div>
                    <h3>{community.name}</h3>
                    <div className='ch-right'>
                        {community.isMember && <div className='chr cursor' onClick={() => setModal('create')}>
                            <FaPlus className='chr-icon' />
                            <span>Create Post</span>
                        </div>}
                        {
                            loading ? <div className='member-loading'><SkeletonLoader /></div> :
                            community.isMember ? 
                            <div className='chr-'>Member</div> :
                            <div className='chr join cursor' onClick={handleJoin}>
                                {joinLoading ? 'Joining...' : 'Join'}
                            </div>
                        }
                    </div>
                </div>

                <div className='community-header'>
                    <div className={`community-banner ${scrolled}`}>
                        <img src={community.meta_data.banner_url} alt='banner' />
                    </div>
                    <div className={`ch ${scrolled}`}>
                        {/* community.meta_data.banner_url for banner image */}
                        <div className='ch-img'>
                            {community.meta_data.profile_url && <img src={community.meta_data.profile_url} alt='avatar' />}
                        </div>
                        <h3>{community.name}</h3>
                        <div className='ch-right'>
                            {community.isMember && <div className='chr cursor' onClick={() => setModal('create')}>
                                <FaPlus className='chr-icon' />
                                <span>Create Post</span>
                            </div>}
                            {
                                loading ? <div className='member-loading'><SkeletonLoader /></div> :
                                community.isMember ? 
                                <div className='chr-'>Member</div> :
                                <div className='chr join cursor' onClick={handleJoin}>
                                    {joinLoading ? 'Joining...' : 'Join'}
                                </div>
                            }
                        </div>
                    </div>
                </div>

                {/* if there is content_id then we are viewing content of a feed so remove this nav */}
                {!content_id && <div className='cm-nav'>
                    <div className={`cm-nav-btn cursor ${route==='Feed'?true:false}`} onClick={() => setRoute('Feed')}>Feed</div>
                    <div className={`cm-nav-btn cursor ${route==='About'?true:false}`} onClick={() => setRoute('About')}>About</div>
                </div>}

                {/* 
                    for  desktop frame, about will be by the side and if we click content, 
                    the content page shows in feed part, if we switch to mobile view
                    we know that if we are in content page then about cannot be active in route state 
                    because before we press the content to get to its (content) page, we were in post route state
                    so about div will be display: none, and so content page fills the div with about not interfering
                */}

                <div className='community-main'>

                    <div className={`cm-Feed ${route==='Feed'?true:false} hide_scrollbar`}>   
                        <Routes>
                            <Route 
                                path='/' 
                                element={<CommunityPageHome route={route} dummy={dummy} id={id} error={error}
                                feeds={feeds} loading={loading} fetchFeeds={fetchFeeds} isMember={community.isMember} />} 
                            />
                            <Route 
                                path='/:content_id'
                                element={<CommunityContent feeds={feeds} error={error} />}
                            />
                        </Routes>
                    </div>

                    <div className={`cm-About ${route==='About'?true:false}`}>
                        <h4>About community</h4>
                        <div className='cm-dets'>
                            <span className='cmd-title'>{community.meta_data.niche}</span>
                            <span className='cmd-desc'>{community.meta_data.description}</span>
                        </div>
                        <div className='cm-data'>
                            <div className='cmd-metric'>
                                <span className='cmdm-value'>{amountShort((community['numbers of members'] - 0) + 1)}</span>
                                <span className='cmdm-name'>Member(s)</span>
                            </div>
                            
                            {loading && <div className='cmd-metric'>
                                <div className='cmdm-value cmdm-loading'><SkeletonLoader /></div>
                                <div className='cmdm-name cmdm-loading'><SkeletonLoader /></div>
                            </div>}

                            {!loading && <div className='cmd-metric'>
                                <span className='cmdm-value'>{amountShort(feeds.length)||0}</span>
                                <span className='cmdm-name'>Posts</span>
                            </div>}
                            
                            <div className='cmd-metric'>
                                <span className='cmdm-value cmdm-date'>{formatDate(community.created_at, true, true)}</span>
                                <span className='cmdm-name'>Created</span>
                            </div>
                        </div>
                        <div className='cm-admins'>
                            <span>CREATOR</span>
                            <div>
                                <div className='cma-li'>
                                    <div className='cmal-img'></div>
                                    <span className='cmal-txt'>{community.creator}</span>
                                </div>
                                {/* {community.admins.map((val, idx) => (
                                    <div className='cma-li' key={`cm-${idx}`}>
                                        <div className='cmal-img'></div>
                                        <span className='cmal-txt'>{val}</span>
                                    </div>
                                ))} */}
                            </div>
                        </div>
                        <div className='cm-Topics'>
                            <span>TOPICS</span>
                            <div className='cm-topics'>
                                {community.meta_data.topics.map((val, idx) => (  
                                    <div key={`topic-${idx}`}>{val}</div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                
            </div>
        }
        
        {modal && <CommunityPostModal closeModal={closeModal} destination={community.name} 
        setFeeds={setFeeds} feeds={feeds} community_id={id} />}

        </div>
    );
};

export default CommunityPage;