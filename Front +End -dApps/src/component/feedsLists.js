import { BiDownvote, BiUpvote } from 'react-icons/bi';
import { formatDate } from '../utils';
import './feedsLists.css';
import ContentFile from './contentFile';
import ContentText from './contentText';
import { useNavigate } from 'react-router-dom';

const FeedsLists = ({ feeds, navToContentPage, community, linkCopyable }) => {

    const navigate = useNavigate();

    return (
        <ul className='feeds__lists'>
            {feeds.map((val, idx) => (
                <li key={`f-l-${idx}`} className='f-l-feed-li cursor' onClick={() => navToContentPage(val.content_id)}>
                    <div className='f-l-top'>
                        <div className='f-l-t-img'></div>
                        <span className='f-l-t-poster cursor'
                        onClick={() => navigate(`/app/profile/${val.author_id}`)}>
                            {val.author}
                        </span>
                        <span className='f-l-t-time'>{`Posted ${formatDate(val.timestamp, true)}`}</span>
                        {/* add something for community, only for votes in profile home page */}
                        {(community && val.community_id > 0) && <div className='community-linkup'>
                            For community
                        </div>}
                    </div>
                    <div className='f-l-mid'>
                        <div className='pl-mid-title'>{val.sub_data.title}</div>
                        <ContentText content={val.sub_data.content} />
                        {val.sub_data.secure_url && <ContentFile data={val.sub_data} />}
                    </div>
                    <div className='f-l-base'>
                        <div className='f-l-b-left'>
                            {val.sub_data.tags.map((val, idx) => (
                                <div key={`f-l-b-${idx}`}>{val}</div>
                            ))}
                        </div>
                        <div className='f-l-b-right'>
                            <div className='f-l-b-votes'>
                                <BiUpvote className="f-l-b-v-icon" />
                                <span>{val.votes}</span>
                                <BiDownvote className="f-l-b-v-icon down-vote" />
                            </div>
                        </div>
                    </div>
                </li>
            ))}
        </ul>
    );
};

export default FeedsLists;