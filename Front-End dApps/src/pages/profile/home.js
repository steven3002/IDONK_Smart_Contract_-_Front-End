import { useEffect, useState } from "react";
import './home.css';
import ProfileHomeLoading from "./load";
// import { IoIosCopy } from "react-icons/io";
import { useDispatch, useSelector } from "react-redux";
import { setUser } from "../../store/user";
import { amountShort, decodeData, decodeUint8, getDate, inProductionContent, parseContentData, ProfileAvatar, setMessageFn } from "../../utils";
import ErrorPage from "../../component/error";
import { createContentContractInstance, createUserContractInstance } from "../../services/contracts_creators";
import { bindActionCreators } from "redux";
import SkeletonLoader from "../../component/skeleton";
import UserPageHome from "./userPageHome";
import UserPageContent from "./userPageContent";
import { BAD_INDEX, FRONTEND_URL } from "../../config";
import { useParams } from "react-router-dom";
import { IoIosCopy } from "react-icons/io";
import { setMessage } from "../../store/message";


const ProfileHomePage = () => {

    const [loading, setLoading] = useState('fetching');
    const [error, setError] = useState(false);
    const [route, setRoute] = useState('Post');
    const [feeds, setFeeds] = useState([]);
    const [votes, setVotes] = useState([]);
    const [feedsData, setFeedsData] = useState([]);
    const [userMetaData, setUserMetaData] = useState({});
    const [contentId, setContentId] = useState('');

    const user = useSelector(state => state.user);
    const contract = useSelector(state => state.contract);
    const [profileUser, setProfileUser] = useState({});
    
    const dispatch = useDispatch();
    const { id } = useParams();
    const setUserData = bindActionCreators(setUser, dispatch);
    const setMessageData = bindActionCreators(setMessage, dispatch);

    const fetchFeeds = async () => {
        setLoading(true);
        const userContractInstance = await createUserContractInstance(contract.signer);
        const contentContractInstance = await createContentContractInstance(contract.signer);
        const meta_data = await contentContractInstance.getProfile(id);
        setUserMetaData(JSON.parse(meta_data));
        const res = await contentContractInstance.getContentList(0);
        const data = [];
        for(const response of Array.from(res).reverse()) {
            // if(!inProductionContent(response)) continue;
            const value = parseContentData(response);
            if(value.author === contract.address) {
                const author = await userContractInstance.getUsername(value.author);
                const total_votes = await contentContractInstance.getTotalVotes(value.content_id-0);
                data.push({ ...value, author, votes: total_votes });
            }
        }
        setFeeds(data);
        setFeedsData(data);
        const stakes = await contentContractInstance.getMyStakes(id);
        const stk_data = [];
        for(const stakeId of Array.from(stakes).reverse()) {
            const stake_id = stakeId +'';
            // if(stake_id < BAD_INDEX) continue;
            const resp = parseContentData(await contentContractInstance.getContent(stake_id-0));
            // resp.community_id
            const author = await userContractInstance.getUsername(resp.author);
            const total_votes = await contentContractInstance.getTotalVotes(stake_id-0);
            stk_data.push({ ...resp, author, votes: total_votes });
        }
        setVotes(stk_data);
    };

    const fetchUser = async () => {
        if(!contract.signer) return setError(true);

        setError(false);
        setLoading(( id === contract.address && user.name ) ? true : 'fetching');
        
        // still fetch in case a new content has been created
        try {
            // by hierachy this should work
            // cus first we check if it is not user then we just start fetching data
            // else we know the id is user's own, so now check if user data is present
            if(id === contract.address && user.name) setProfileUser(user);
            else {
                const userContractInstance = await createUserContractInstance(contract.signer);
                const res = await userContractInstance.getMetaData(id);
                const userRes = JSON.parse(res);
                const metaData = decodeData(userRes.metaData, 'bytes');
                if(id === contract.address) setUserData({ ...userRes, ...metaData });
                setProfileUser({ ...userRes, ...metaData });
            } 
            await fetchFeeds();
            setLoading(false); 
        } catch (err) {
            setError(true);
            setLoading(false); 
        }
    };

    useEffect(() => {
        fetchUser();
    }, []);

    const fn = (value) => {
        setRoute(value);
        if(value === 'Post') setFeedsData(feeds);
        if(value === 'Votes') setFeedsData(votes);
    };

    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(`${FRONTEND_URL}/app/profile/${id}`);
            setMessageFn(setMessageData, { status: 'success', message: 'Link copied.' });
        } catch (err) {
            setMessageFn(setMessageData, { status: 'error', message: 'Failed to copy.' });
        }
    };

    return (
        <div className="__Profile__">
            <div className="profile-wrapper">
                <div className="profile-content">
                    {
                        (error && !profileUser.name) ?

                        <ErrorPage refreshFn={fetchUser} /> :

                        loading === 'fetching' ?

                        <ProfileHomeLoading /> :

                        <div className="profile-Main">
                            <header>
                                <div className="pm-header-img">
                                    {
                                        profileUser.secure_url ? 
                                        <img src={profileUser.secure_url} alt="user-profile" /> :
                                        <ProfileAvatar />
                                    }
                                </div>
                                <div className="pm-header-txt">
                                    <h3>{profileUser.name}</h3>
                                    <span>{profileUser.email}</span>
                                </div>
                            </header>
                            <main className="pM-main">
                                <div className={`pm-nav`}>
                                    <div className={`pm-nav-router ${route==='Post'}`} onClick={()=>fn('Post')}>Posts</div>
                                    <div className={`pm-nav-router ${route==='Votes'}`} onClick={()=>fn('Votes')}>Votes</div>
                                    <div className={`pm-nav-router pmr-about ${route==='About'}`} onClick={()=>fn('About')}>About</div>
                                </div>
                                <div className="PM__Main">
                                    
                                    {/* at this point there is user data but no feeds
                                    error means, error fetching feeds
                                    fetch user will chcek if there is user before fetching feeds
                                    and since there will be user data already now
                                    it will only retry fetching feeds */}

                                    <div className={`PM__Posts ${route!=='About'}`}>
                                        {
                                            !contentId ?
                                            <UserPageHome route={route} error={error} loading={loading}
                                            setContentId={setContentId} fetchUser={fetchUser} feedsData={feedsData} /> :
                                            <UserPageContent feeds={feedsData} setContentId={setContentId} 
                                            error={error} contentId={contentId} />
                                        }
                                    </div>

                                    <div className={`PM__About ${route==='About'}`}>
                                        <div className="pm-about">
                                            <span className="pm-subtopic">DESCRIPTION</span>
                                            <div className="pm-about-txt"><span>{profileUser.about}</span></div>
                                            
                                            {!userMetaData.joined_at && <div className="joined-at pm-about-txt-loading">
                                                <SkeletonLoader />
                                            </div>}
                                            {!userMetaData.joined_at && <div className="pm-about-txt-loading">
                                                <SkeletonLoader />
                                            </div>}

                                            {userMetaData.joined_at && <span className="joined-at">JOINED</span>}
                                            {userMetaData.joined_at && <div className="pm-about-txt pat-ja">
                                                <span>{getDate(userMetaData.joined_at, true)}</span>
                                            </div>}

                                            
                                            <div className="pm-share-profile">
                                                <span className="pm-subtopic">PROFILE LINK</span>
                                                <div className='pm-share-profile-link'>
                                                    <span>{`${FRONTEND_URL}/app/profile/${id}`}</span>
                                                    <div onClick={copyLink}><IoIosCopy className="pm-share-profile-icon" /></div>
                                                </div>
                                            </div>

                                        </div>
                                        {
                                            loading ?

                                            <div className="pm-data">
                                                <div className="pmd-metrics">
                                                    <span className="pdm-metrics-value pmd-loading"><SkeletonLoader /></span>
                                                    <span className="pdm-metrics-name pmd-loading"><SkeletonLoader /></span>
                                                </div>
                                                <div className="pmd-metrics">
                                                    <span className="pdm-metrics-value pmd-loading"><SkeletonLoader /></span>
                                                    <span className="pdm-metrics-name pmd-loading"><SkeletonLoader /></span>
                                                </div>
                                                <div className="pmd-metrics">
                                                    <span className="pdm-metrics-value pmd-loading"><SkeletonLoader /></span>
                                                    <span className="pdm-metrics-name pmd-loading"><SkeletonLoader /></span>
                                                </div>
                                            </div> : 

                                            <div className="pm-data">
                                                <div className="pmd-metrics">
                                                    <span className="pdm-metrics-value">
                                                        {amountShort(userMetaData.reputation||0)}
                                                    </span>
                                                    <span className="pdm-metrics-name">Reputation</span>
                                                </div>
                                                <div className="pmd-metrics">
                                                    <span className="pdm-metrics-value">{amountShort(feeds.length)}</span>
                                                    <span className="pdm-metrics-name">Posts</span>
                                                </div>
                                                <div className="pmd-metrics">
                                                    <span className="pdm-metrics-value">{amountShort(votes.length)}</span>
                                                    <span className="pdm-metrics-name">Votes</span>
                                                </div>
                                            </div>
                                        }
                                        
                                        <div className="pm-topics">
                                            <span className="pm-subtopic">INTERESTS</span>
                                            <div className="pmt">
                                                <div className="pmt_">
                                                    {profileUser.interests.map((val, idx) => (
                                                        <div className="pmt-div" key={`pmt-${idx}`}>{val}</div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </main>
                        </div>
                    }
                </div>
            </div>
        </div>
    );
};

export default ProfileHomePage;