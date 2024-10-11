import { useEffect, useMemo, useRef, useState } from 'react';
import './content.css';
import { BiUpvote, BiSolidUpvote, BiSolidDownvote, BiDownvote } from 'react-icons/bi';
import { AiOutlineClose } from 'react-icons/ai';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import StakeContentModal from './stakeModal';
import { useDispatch, useSelector } from 'react-redux';
import { formatDate, getTokenAmount, parseContentData, ProfileAvatar, rewardableThreshold, setMessageFn } from '../../utils';
import ContentFile from '../../component/contentFile';
import SkeletonLoader from '../../component/skeleton';
import { 
    createContentContractInstance, 
    createRewardsContractInstance, 
    createUserContractInstance 
} from '../../services/contracts_creators';

import ErrorPage from '../../component/error';
import { bindActionCreators } from 'redux';
import { setMessage } from '../../store/message';
import NoData from '../../component/nodata';
import { IoIosCopy } from 'react-icons/io';
import { FRONTEND_URL } from '../../config';

const Content = () => {

    const groupings = ['string', 'powershell', 'web3', 'ethereum'];
    const [voted, setVoted] = useState(''); 
    const [modal, setModal] = useState('');
    const [loading, setLoading] = useState(true);
    const [votesLoading, setVotesLoading] = useState(true);
    const [isRewarded, setIsRewarded] = useState(false);
    const [claiming, setClaiming] = useState(false);
    const [voters, setVoters] = useState([]);
    const [error, setError] = useState(false);
    const [content, setContent] = useState({});
    const [userVoteType, setUserVoteType] = useState(0);
    const [totalVotes, setTotalVotes] = useState(0);
    const textRef = useRef();
    const contentError = 'No content with this id';

    const navigate = useNavigate();
    const loc = useLocation();
    const { id } = useParams();
    
    const contract = useSelector(state => state.contract);
    const user = useSelector(state => state.user);
    const cnt = useSelector(state => state.contents).find(val => val.content_id == id);

    const dispatch = useDispatch();
    const setMessageData = bindActionCreators(setMessage, dispatch);

    function clickFn(type) { 
        // if user has voted , then do not show stake modal
        // console.log('cfn', userVoteType, userVoteType==0, votesLoading);
        if(userVoteType != 0) return;

        if(votesLoading) return;
        setModal(true);
        setVoted(type); 
    };
    function closeModal() { setModal(''); }

    const fetchVoters = async (contentContractInstance, userContractInstance) => {
        setVotesLoading(true);
        const votes_data = await contentContractInstance.getVoters(id-0);
        const data = [];
        for(const vote_data of Array.from(votes_data).reverse()) {
            const vote = JSON.parse(vote_data);
            const author = await userContractInstance.getUsername(vote.voters_id);
            data.push({ ...vote, name: author });
        }
        const rewardsContractInstance = await createRewardsContractInstance(contract.signer);
        const is_rewarded = await rewardsContractInstance.isRewarded(id-0);
        const vote_type = await rewardsContractInstance.myVote(id-0);
        const total_votes = await contentContractInstance.getTotalVotes(id-0);
        setTotalVotes(total_votes - 0);
        setUserVoteType(vote_type - 0);
        setIsRewarded(is_rewarded);
        setVoters(data);
        setVotesLoading(false);
    };

    const fetchContent = async () => {
        if(!contract.signer) return setError(true);

        setError(false);
        setLoading(true);
        try {
            const contentContractInstance = await createContentContractInstance(contract.signer);
            const userContractInstance = await createUserContractInstance(contract.signer);
            if(cnt) {
                setContent(cnt);
            } else {
                const res = await contentContractInstance.getContent(id-0);
                if(!res) {
                    return setError(contentError);
                }
                const value = parseContentData(res);
                const author = await userContractInstance.getUsername(value.author);
                setContent({ ...value, author, author_id: value.author });
            }     
            setLoading(false); 
            await fetchVoters(contentContractInstance, userContractInstance);
        } catch (err) {
            setError(true);
            setLoading(false); 
            setVotesLoading(false);
        }
    };

    useEffect(() => {
        fetchContent();
    }, []);

    useEffect(() => {
        if(textRef.current && content.sub_data) {
            textRef.current.innerHTML = content.sub_data.content;
        }
    }, [content.sub_data?.content]);

    const date_val = useMemo(() => {
        const date = String(new Date(content.timestamp));
        return date.slice(0, 15) + ' at ' + date.slice(16, 21);
    }, []);

    const nav = () => {
        if(loc.key !== "default") navigate(-1);
        else navigate('/app');
    };

    const claimReward = async () => {
        try {
            const rewardsContractInstance = await createRewardsContractInstance(contract.signer);
            // check if user can claim reward i.e we not in cool down period
            const can_be_rewarded = await rewardsContractInstance.canBeRewarded(id-0);
            if(can_be_rewarded) {
                setClaiming(true);
                await rewardsContractInstance.getReward(id-0);
                setIsRewarded(true);
                setMessageFn(setMessageData, { status: 'success', message: 'Claimed your reward successfully.' });
                setClaiming(false);
            } else {
                setClaiming(false);
                setMessageFn(setMessageData, { 
                    status: 'error', 
                    message: 'Sorry claiming is currently in cool down period. Try again in next 5 mins.' 
                });
            }
        } catch (err) {
            setClaiming(false);
            setMessageFn(setMessageData, { status: 'error', message: 'There was an Error. Check internet and try again.' });
        }
    };
    
    const dummy = Array(6).fill(0);

    const showRewardButton = useMemo(() => {
        // userVoteType && !isRewarded because
        // isRewarded is true for all but is correct or updated for users who have voted
        if(!loading && (userVoteType && !isRewarded) && rewardableThreshold(userVoteType, totalVotes)) return true;
        else return false;
    }, [userVoteType, loading, isRewarded, totalVotes]);

    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(`${FRONTEND_URL}/app/post/${id}`);
            setMessageFn(setMessageData, { status: 'success', message: 'Link copied.' });
        } catch (err) {
            setMessageFn(setMessageData, { status: 'error', message: 'Failed to copy.' });
        }
    };

    const setUserVoteTypeFn = async (vote_data, type) => {
        try {
            setVotesLoading(true);
            setVoters([{ ...vote_data, name: user.name }, ...voters]);
            setUserVoteType(type-0);
            setTotalVotes((totalVotes-0) + 1);
            setVotesLoading(false);
        } catch (err) {
            setVotesLoading(false);
            setMessageFn(setMessageData, { status: 'error', message: 'There was an Error. Check your internet.' });
        }
    };

    return (
        <div className="post-content">
            {!error && <div className='content-header'>
                <AiOutlineClose className='ch-icon cursor' onClick={() => nav()} />
            </div>}
            {
            error ?

            <div className='pc-main-error'>
                <ErrorPage text={error === contentError ? error : ''} 
                    important={true} btnName={error === contentError ? 'Go back to Home page.' : ''} 
                    refreshFn={() => {
                        if(error === contentError) return navigate('/app');
                        fetchContent();
                    }} 
                />
            </div> :

            // we already handled for when content not found based on wrong id
            // with error page

            <div className='pc-main'>
                {!loading ? <h4>{content.sub_data.title}</h4> : <div className='pcm-loading'><SkeletonLoader /></div>}

                {
                    !loading ? 
                    <div className='pc-main-p'>
                        <span>{`Posted ${formatDate(content.timestamp, true)}`}</span>

                        {showRewardButton && <div className='post__Reward'>
                            <div className='claim-post-reward cursor' onClick={claimReward}>
                                {claiming ? 'Claiming...' : 'Claim'}
                            </div>
                        </div>}
                    </div> : 
                    <div className='pcm-loading p'>
                        <div><SkeletonLoader /></div>
                        <div><SkeletonLoader /></div>
                    </div>
                }

                {!loading && content.sub_data.secure_url && <ContentFile data={content.sub_data} />}

                <div className='pc-txt' ref={textRef}></div>
                <div className="pc-groupings">
                    {
                        loading ?
                        <div className='pl-groupings'>
                            <div className='plg-loading'><SkeletonLoader /></div>
                        </div> :
                        <div className='pl-groupings'>
                            {content.sub_data.tags.map((val, idx) => (
                                <div className='pl-group' key={`plg-${idx}`}>{val}</div>
                            ))}
                        </div>
                    }
                </div>
                <div className='pc-base'>
                    <div className="pc-voting">
                        <div className={`pcv ${!loading&&'cursor'}`} onClick={() => clickFn('up')}>
                            {userVoteType === 1 ? <BiSolidUpvote className="pcv-icon" /> : <BiUpvote className="pcv-icon" />}
                            {loading || votesLoading ? 
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
                        <div className="pd-img">{loading ? <SkeletonLoader /> : <ProfileAvatar />}</div>
                        {
                            loading ? 
                            <div className='pd-txt'>
                                <div className="pd-poster pdt-loading"><SkeletonLoader /></div>
                                <div className="pd-post-time pdt-loading"><SkeletonLoader /></div>
                                <div className="pd-post-time pdt-loading"><SkeletonLoader /></div>
                            </div> :
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
                        }

                    </div>
                </div>

                {/* Add loading spinner here if we want to add a div to fetch users that staked/voted on this post */}
                {/* Hasn't been styled yet */}
                <div className='content__Voters'>
                    <h3>Voters</h3>
                    {
                        votesLoading ?
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
            </div>
            }
            
            {modal && <StakeContentModal closeModal={closeModal} setUserVoteTypeFn={setUserVoteTypeFn}
            content_id={id} setMessageData={setMessageData} community_id={null} />}
        </div>
    );
};

export default Content;