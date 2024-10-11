import { useEffect, useMemo, useRef, useState } from 'react';
import '../content/content.css';
import './community.css';
import { BiUpvote, BiDownvote, BiSolidDownvote, BiSolidUpvote } from 'react-icons/bi';
import { AiOutlineClose } from 'react-icons/ai';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import StakeContentModal from '../content/stakeModal';
import { useDispatch, useSelector } from 'react-redux';
import { formatDate, getTokenAmount, parseContentData, ProfileAvatar, rewardableThreshold, setMessageFn } from '../../utils';
import ContentFile from '../../component/contentFile';
import SkeletonLoader from '../../component/skeleton';
import { 
    createContentContractInstance, 
    createRewardsContractInstance, 
    createUserContractInstance 
} from '../../services/contracts_creators';

import { bindActionCreators } from 'redux';
import { setMessage } from '../../store/message';
import NoData from '../../component/nodata';
import { IoIosCopy } from 'react-icons/io';
import { FRONTEND_URL } from '../../config';
import ErrorPage from '../../component/error';
import CommunityLoading from './load';

const CommunityContent = ({ feeds, error }) => {

    const [modal, setModal] = useState('');
    const [voted, setVoted] = useState(''); 
    const [errorCnt, setErrorCnt] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isRewarded, setIsRewarded] = useState(false);
    const [claiming, setClaiming] = useState(false);
    const [voters, setVoters] = useState([]);
    const [userVoteType, setUserVoteType] = useState(0);
    const [totalVotes, setTotalVotes] = useState(0);
    const [claimNotif, setClaimNotif] = useState('');
    const textRef = useRef();

    const navigate = useNavigate();
    const loc = useLocation();
    const { id, content_id } = useParams();
    
    const contract = useSelector(state => state.contract);
    const user = useSelector(state => state.user);

    const dispatch = useDispatch();
    const setMessageData = bindActionCreators(setMessage, dispatch);

    const cnt = feeds.find(val => val.content_id == content_id);
    const [content, setContent] = useState(cnt || {});
    const contentError = 'No content with this id';

    function clickFn(type) { 
        // if user has voted , then do not show stake modal
        if(userVoteType) return;

        if(loading) return;
        setModal(type);
        setVoted(type); 
    };
    function closeModal() { setModal(''); }

    const fetchVoters = async () => {

        setErrorCnt(false);
        setLoading(!content.author ? 'fetching' : true);
        const contentContractInstance = await createContentContractInstance(contract.signer);
        const userContractInstance = await createUserContractInstance(contract.signer);

        try {
            if(!content.author) {
                const res = await contentContractInstance.getContent(content_id-0);
                if(!res) {
                    return setErrorCnt(contentError);
                }
                const value = parseContentData(res);
                const author = await userContractInstance.getUsername(value.author);
                setContent({ ...value, author, author_id: value.author });
                setLoading(true);
            } else {
                setLoading(true);
            }

            const votes_data = await contentContractInstance.getVoters(content_id-0);
            const data = [];
            for(const vote_data of Array.from(votes_data).reverse()) {
                const vote = JSON.parse(vote_data);
                if(vote.voters_id === contract.address) {
                    setUserVoteType(vote.vote);
                }
                const author = await userContractInstance.getUsername(vote.voters_id);
                data.push({ ...vote, name: author });
            }
            const rewardsContractInstance = await createRewardsContractInstance(contract.signer);
            const is_rewarded = await rewardsContractInstance.isRewarded(content_id-0);
            const vote_type = await rewardsContractInstance.myVote(content_id-0);
            const total_votes = await contentContractInstance.getTotalVotes(content_id-0);
            setTotalVotes(total_votes - 0);
            setUserVoteType(vote_type - 0);
            setIsRewarded(is_rewarded);
            setVoters(data);
            setLoading(false);
        } catch(err) {
            setErrorCnt(true);
            setLoading(false);
            setMessageFn(setMessage, { status: 'error', message: 'Error with request. Check internet and try again.'});
        }
    };

    useEffect(() => {
        // No need to fetch content data because before this page, the parent page which is in 'community.js'
        // will have mounted and useEffect on mount there has handled for fectching content_list posts
        // so if error, it would have been blocked there
        fetchVoters();
    }, []);

    useEffect(() => {
        if(textRef.current && content.sub_data) {
            textRef.current.innerHTML = content.sub_data.content;
        }
    }, [content?.content]);

    const date_val = useMemo(() => {
        const date = String(new Date(content.timestamp));
        return date.slice(0, 15) + ' at ' + date.slice(16, 21);
    }, []);

    const nav = () => {
        if(loc.key !== "default") navigate(-1);
        else navigate('/app');
    };

    const setter = (note) => {
        setClaimNotif(note);
        setTimeout(() => setClaimNotif(''), 2000);
    };

    const claimReward = async () => {
        if(!userVoteType) return setter('Vote/Stake on the content before you can get reward.');
        if(isRewarded) return setter('You have claimed reward for this content already.');
        if(!rewardableThreshold(userVoteType, totalVotes)) return setter('Reward threshold has not been reached.');

        try {
            const rewardsContractInstance = await createRewardsContractInstance(contract.signer);
            // check if user can claim reward i.e we not in cool down period
            const can_be_rewarded = await rewardsContractInstance.canBeRewarded(content_id-0);
            if(can_be_rewarded) {
                setClaiming(true);
                await rewardsContractInstance.getReward(content_id-0);
                setIsRewarded(true);
                setMessageFn(setMessageData, { status: 'success', message: 'Claimed your reward successfully.' });
                setClaiming(false);
            } else {
                setClaiming(false);
                setMessageFn(setMessageData, { 
                    status: 'error', 
                    message: 'Sorry claiming is currently in cool down period. Try again after 5 mins.' 
                });
            }
        } catch (err) {
            console.log(err);
            setMessageFn(setMessageData, { status: 'error', message: 'There was an Error. Check internet and try again.' });
        }
    };
    
    const dummy = Array(6).fill(0);
    
    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(`${FRONTEND_URL}/app/community/page/${id}/${content_id}`);
            setMessageFn(setMessageData, { status: 'success', message: 'Link copied.' });
        } catch (err) {
            setMessageFn(setMessageData, { status: 'error', message: 'Failed to copy.' });
        }
    };

    const setUserVoteTypeFn = async (vote_data, type) => {
        try {
            setLoading(true);
            setVoters([{ ...vote_data, name: user.name }, ...voters]);
            setUserVoteType(type-0);
            setTotalVotes((totalVotes-0) + 1);
            setLoading(false);
        } catch (err) {
            setLoading(false);
            setMessageFn(setMessageData, { status: 'error', message: 'There was an Error. Check your internet.' });
        }
    };

    return (
        <div className="post-content">
            {!error && <div className='content-header'>
                <AiOutlineClose className='ch-icon cursor' onClick={() => nav()} />
            </div>}
            {
            
            ( error || errorCnt ) ?

            <div className='pc-main-error'>
                <ErrorPage text={errorCnt === contentError ? errorCnt : ''} 
                    important={true} btnName={errorCnt === contentError ? 'Go back to Home page.' : ''} 
                    refreshFn={() => {
                        if(errorCnt === contentError) return navigate('/app');
                        fetchVoters();
                    }} 
                />
            </div> :

            loading === 'fetching' ?

            <div className='cmtContent'><CommunityLoading /></div> :

            !content.author ? <NoData text={'Content not found in this community.'} /> :

            content.author && <div className='pc-main'>
                <h4>{content.sub_data.title}</h4>
                
                <div className='pc-main-p'>
                    <span>{`Posted ${formatDate(content.timestamp, true)}`}</span>

                    {!loading && <div className='post__Reward'>
                        <div className={`claim-post-reward cursor ${userVoteType-0 !== 0}`} onClick={claimReward}>
                            {claiming ? 'Claiming...' : 'Claim'}
                        </div>
                        {claimNotif && <div className='claimNotif'>{claimNotif}</div>}
                    </div>}
                </div>

                {content.sub_data.secure_url && <ContentFile data={content.sub_data} />}

                <span className='pc-txt' ref={textRef}></span>
                <div className="pc-groupings">
                    <div className='pl-groupings'>
                        {content.sub_data.tags.map((val, idx) => (
                            <div className='pl-group' key={`plg-${idx}`}>{val}</div>
                        ))}
                    </div>
                </div>
                <div className='pc-base'>
                    <div className="pc-voting">
                        <div className={`pcv ${'cursor'}`} onClick={() => clickFn('up')}>
                            {userVoteType === 1 ? <BiSolidUpvote className="pcv-icon" /> : <BiUpvote className="pcv-icon" />}
                            {loading ? 
                                <div className="pcv-txt pcvt-loading"><SkeletonLoader /></div> : 
                                <span className="pcv-txt">{totalVotes}</span>
                            }
                            {
                                userVoteType === -1 ? 
                                <BiSolidDownvote className="pcv-icon" /> : 
                                <BiDownvote className="pcv-icon down-vote-" />
                            }
                        </div>
                    </div>
                    <div className="pc-details">
                        <div className="pd-img"><ProfileAvatar /></div>
                        <div className='pd-txt'>
                            <span className="pd-poster cursor"
                            onClick={() => navigate(`/app/profile/${content.author_id}`)}>
                                {content.author}
                            </span>
                            <span className="pd-post-time">{formatDate(content.timestamp, true)}</span>
                            <div className='pdt-link cursor' onClick={copyLink}>
                                Copy post link <IoIosCopy className="pdt-icon" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>}

            {/* Add loading spinner here if we want to add a div to fetch users that staked/voted on this post */}
            {/* Hasn't been styled yet */}
            <div className='content__Voters'>
                <h3>Voters</h3>
                {
                    loading ?
                    <div className='voters__Loading'>
                        <ul>
                            {dummy.map((val, idx) => (
                                <li key={`vli-${idx}`} className='voters-li'>
                                    <div className='vli-txt-loading'>
                                        <div><SkeletonLoader /></div>
                                        <div><SkeletonLoader /></div>
                                    </div>
                                    <div className='vli-stake'><SkeletonLoader /></div>
                                </li>
                            ))}
                        </ul>
                    </div> :
                    <div className='Voters'>
                        {
                            voters.length === 0 ?
                            <NoData text={'No voters for this content yet'} /> :
                            <ul>
                                {voters.map(val => (
                                        <li key={val.voters_id} className='voters-li'>
                                            <div className='vli-txt'>
                                                <span className='vlit-name'>{val.name}</span>
                                                <span className='vlit-time'>Voted {formatDate(val.time_stamp, true)}</span>
                                            </div>
                                            <div className='vli-txt-stake'>
                                                <span>{getTokenAmount(val.stake) + ' ' + 'IDONK'}</span>
                                            </div>
                                        </li>
                                ))}
                            </ul>
                        }
                    </div>
                }
            </div>
            
            {modal && <StakeContentModal closeModal={closeModal} setUserVoteTypeFn={setUserVoteTypeFn}
            content_id={content_id} setMessageData={setMessageData} community_id={id} />}
        </div>
    );
};

export default CommunityContent;