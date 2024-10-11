import './feedsLists.css';
import SkeletonLoader from './skeleton';

const FeedsListsLoading = () => {

    const feeds = Array(6).fill(0);

    return (
        <ul className='feeds__lists'>
            {feeds.map((val, idx) => (
                <li key={`f-l-${idx}`} className='f-l-feed-li'>
                    <div className='f-l-top'>
                        <div className='f-l-t-img f-l-img-loading'><SkeletonLoader /></div>
                        <div className='f-l-t-poster f-l-t-loading'><SkeletonLoader /></div>
                        <div className='f-l-t-time f-l-t-loading'><SkeletonLoader /></div>
                    </div>
                    <div className='f-l-mid'>
                        <div className='f-l-mid-txt-loading'><SkeletonLoader /></div>
                    </div>
                    <div className='f-l-base'>
                        <div className='f-l-b-left f-l-loading'>
                            <SkeletonLoader />
                        </div>
                        <div className='f-l-b-right'>
                            <div className='f-l-b-votes f-l-b-v-loading'>
                                <SkeletonLoader />
                            </div>
                        </div>
                    </div>
                </li>
            ))}
        </ul>
    );
};

export default FeedsListsLoading;