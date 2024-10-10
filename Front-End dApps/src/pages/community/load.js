import './community.css';
import SkeletonLoader from '../../component/skeleton';

const CommunityLoading = () => {

    const dummy = Array(6).fill(0);
    
    return (
        <div className='community cmty-loading'>
            <div className='community-header'>
                <div className={`community-banner`}><SkeletonLoader /></div>
                <div className={`ch`}>
                    <div className='ch-img'><SkeletonLoader /></div>
                    <h3><div className='cm-subtopic-loading'><SkeletonLoader /></div></h3>
                    <div className='ch-right'>
                        <div className='chr-loading'><SkeletonLoader /></div>
                        <div className='chr-loading'><SkeletonLoader /></div>
                    </div>
                </div>
            </div>
            <div className='community-main'>
                <div className={`cm-Feed true hide_scrollbar`}>
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
                </div>
                <div className={`cm-About false`}>
                    <h4><div className='cm-subtopic-loading'><SkeletonLoader /></div></h4>
                    <div className='cm-dets'>
                        <div className='cmd-title cmd-loading'><SkeletonLoader /></div>
                        <div className='cmd-desc'>
                            <div className='cmd-loading'><SkeletonLoader /></div>
                            <div className='cmd-loading'><SkeletonLoader /></div>
                            <div className='cmd-loading'><SkeletonLoader /></div>
                        </div>
                    </div>
                    <div className='cm-data'>
                        <div className='cmd-metric'>
                            <div className='cmdm-value cmdm-loading'><SkeletonLoader /></div>
                            <div className='cmdm-name cmdm-loading'><SkeletonLoader /></div>
                        </div>
                        
                        <div className='cmd-metric'>
                            <div className='cmdm-value cmdm-loading'><SkeletonLoader /></div>
                            <div className='cmdm-name cmdm-loading'><SkeletonLoader /></div>
                        </div>
                    </div>
                    <div className='cm-admins'>
                        <span><div className='cm-subtopic-loading'><SkeletonLoader /></div></span>
                        <div>
                            <div className='cma-li'>
                                <div className='cmal-img'><SkeletonLoader /></div>
                                <div className='cmal-txt cmal-loading'><SkeletonLoader /></div>
                            </div>
                        </div>
                    </div>
                    <div className='cm-Topics'>
                        <span><div className='cm-subtopic-loading'><SkeletonLoader /></div></span>
                        <div className='cm-topics-loading'>
                            <div><SkeletonLoader /></div>
                            <div><SkeletonLoader /></div>
                            <div><SkeletonLoader /></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    );
};

export default CommunityLoading;