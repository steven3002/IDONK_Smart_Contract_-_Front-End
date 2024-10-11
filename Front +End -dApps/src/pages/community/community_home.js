import { useNavigate } from 'react-router-dom';
import ErrorPage from '../../component/error';
import FeedsLists from '../../component/feedsLists';
import NoData from '../../component/nodata';
import SkeletonLoader from '../../component/skeleton';
import { amountShort, formatDate } from '../../utils';
import './community.css';

const CommunityPageHome = ({ route, error, dummy, feeds, isMember, loading, fetchFeeds, id }) => {

    const navigate = useNavigate();

    return (
        <div className={`cm-Feed-div ${route==='Feed'?true:false}`}>
            {
                error ?

                <div className='cp-error'>
                    <ErrorPage text={'Network error. Check internet and try again.'} refreshFn={fetchFeeds} />
                </div> 

                :

                loading ?
                <ul>
                    {dummy.map((val, idx) => (
                        <li key={`feed-loading-${idx}`} className='feed-li feed-li-loading'>
                            <div className='fl-top'>
                                <div className='flt-img'><SkeletonLoader /></div>
                                <div className='flt-poster'><SkeletonLoader /></div>
                                <div className='flt-time'><SkeletonLoader /></div>
                            </div>
                            <div className='fl-mid'>
                                <div className='fl-mid-txt'><SkeletonLoader /></div>
                            </div>
                            <div className='fl-base'>
                                <div className='flb-left'><SkeletonLoader /></div>
                                <div className='flb-right'>
                                    <div className='flb-votes'><SkeletonLoader /></div>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul> 
                :
                ( 
                    feeds.length === 0 ?

                    <NoData 
                    text={`No posts to this Community yet. ${isMember ? 
                        'Click the Create post button to create one now.' : 
                        'Join and be the first to post.'}`
                    } /> :

                    <FeedsLists 
                        feeds={feeds} linkCopyable={true}
                        navToContentPage={(content_id) => {
                            navigate(`/app/community/page/${id}/${content_id}`);
                        }} 
                    />
                )
            }
        </div>
    );
};

export default CommunityPageHome;