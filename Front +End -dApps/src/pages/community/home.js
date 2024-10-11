import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './home.css';
import SkeletonLoader from '../../component/skeleton';

import { useSelector, useDispatch } from 'react-redux';
import { bindActionCreators } from 'redux';
import { setCommunity } from '../../store/community';
import { amountShort, parseCommunityData, setMessageFn } from '../../utils';
import { createCommunitiesContractInstance, createUserContractInstance } from '../../services/contracts_creators';
import ErrorPage from '../../component/error';
import { setSessions } from '../../store/sessions';
import CreateCommunityModal from './modal';
import Pagination from '../../component/pagination';
import { COMMUNITY_PAGINATION_LENGTH } from '../../config';
import NoData from '../../component/nodata';

const CommunityHome = () => {

    const communitiesData = useSelector(state => state.community);
    const contract = useSelector(state => state.contract);
    // keep communities state because of search
    const [communities, setCommunities] = useState(communitiesData||[]);
    const [paginationIndex, setPaginationIndex] = useState(1);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [modal, setModal] = useState(false);
    const sessions = useSelector(state => state.sessions);

    const dispatch = useDispatch();
    const setCommunityData = bindActionCreators(setCommunity, dispatch);
    const setSessionsData = bindActionCreators(setSessions, dispatch);

    const fetchCommunities = async () => {

        if(!contract.signer) return setError(true);
        // no need for setMessage to alert for error, since there is error div for that and 
        // no need to alert success as we are only fetching data not positing anything
        setError(false);
        setLoading(true);
        // if we have loaded communities list, use it as placeholder, while still fetching for newly created communities
        if(sessions.community) {
            setLoading(false);
        }
        // still fetch in case a new community has been created
        try {
            const communityContractInstance = await createCommunitiesContractInstance(contract.signer);
            const userContractInstance = await createUserContractInstance(contract.signer);
            const last_index = await communityContractInstance.getLastIndex();
            const data = [];
            for(let i = 1; i <= last_index; i++) {
                // remove i < 3 line, for production launch
                // if(i < 3) continue; 
                const community = await communityContractInstance.getCommunity(i);
                if(!community) continue;
                const cmmty = parseCommunityData(community);
                const creator = await userContractInstance.getUsername(cmmty.creator);
                data.push({ ...cmmty, creator, community_id: i+'' });
            }
            const Data = data.reverse();
            setCommunityData(Data);
            setCommunities(Data.slice(0, COMMUNITY_PAGINATION_LENGTH));
            if(!sessions.community) setSessionsData({ community: true });
            setLoading(false); 
        } catch (err) {
            setError(true);
            setLoading(false); 
        }
    };

    useEffect(() => {
        fetchCommunities();
    }, []);

    useEffect(() => {
        // only length of community redux state can change based on
        // if we have added or deleted in community redux state, for any change
        // let it just default to start from 0 to pag_length, don't worry its fine and good practice as data as changed
        setCommunities(communitiesData.slice(0, COMMUNITY_PAGINATION_LENGTH));
        setPaginationIndex(1);
    }, [communitiesData.length]);

    function navTo(to) {
        if(loading) return;
        navigate(`/app/community/page/${to}`)
    };

    function closeModal() { setModal(false); }
    const dummy = Array(24).fill(0);

    return (
        <div className='community-Home'>
            <div className='cmH-header'>
                <div className='cmhh'>
                    <h1>Communities</h1>
                    <p>Browse our largest communities</p>
                </div>
                {contract.address && <div className='cmh-btn cursor' onClick={() => setModal(true)}>Create community</div>}
            </div>
            <div className='communities'>
                {
                    error ? 
                    <div className='communities-error'>
                        <ErrorPage text={'Error loading data'} refreshFn={fetchCommunities} />
                    </div> :

                    (!loading && communities.length === 0) ?
                    <div className='No-list-Data'>
                        <NoData text={'No Communities created. Click the Create community button up to create one now.'} />
                    </div> :

                    <ul>
                        {/* Add a condition for if user is searching communities
                            then we will use communities state data here that will have been updated based on search
                        */}
                        {(loading ? dummy : communities).map((val, idx) => (
                            <li key={`cm-${idx}`} className={`cmts-li ${loading?'':'cursor'}`} onClick={() => navTo(val.community_id)}>
                                <div className='cmtsl-img'>
                                    {
                                        loading ? 
                                        <SkeletonLoader /> : 
                                        <div className='d-'>
                                            {val.meta_data.profile_url && <img src={val.meta_data.profile_url} alt='avatar' />}
                                        </div>
                                    }
                                </div>

                                {loading && <div className='cmtsl-txt'>
                                    <div className='cmts-name cmts-loading'><SkeletonLoader /></div>
                                    <div className='cmts-niche cmts-loading'><SkeletonLoader /></div>
                                    <div className='cmts-members cmts-loading'><SkeletonLoader /></div>
                                </div>}

                                {!loading && <div className='cmtsl-txt'>
                                    <span className='cmts-name'>{val.name}</span>
                                    <span className='cmts-niche'>{val.meta_data.niche}</span>
                                    <span className='cmts-members'>{amountShort((val["numbers of members"] - 0) + 1)||1} Member(s)</span>
                                </div>}
                            </li>
                        ))}
                    </ul>
                }
            </div>

            {/* Pagination div goes here */}
            {
                (sessions.community && communitiesData.length > 21) && 
                <Pagination loading={loading} 
                fullLength={Math.ceil( communitiesData.length / 21 )} 
                data={communitiesData} indexSelected={paginationIndex} 
                setIndexSelected={setPaginationIndex} setData={setCommunities} />
            }

            {/* Create Community Modal */}
            {modal && <CreateCommunityModal closeModal={closeModal} />}
        </div>
    );
};

export default CommunityHome;