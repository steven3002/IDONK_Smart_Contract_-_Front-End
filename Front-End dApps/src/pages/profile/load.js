import FeedsListsLoading from '../../component/feedsListsLoading';
import SkeletonLoader from '../../component/skeleton';
import './home.css';

const ProfileHomeLoading = () => {

    const dummy = Array(5).fill(0);
    const interests = Array(8).fill(0);

    return (
        <div className="profile-Main __loading__">
            <header>
                <div className="pm-header-img"><SkeletonLoader /></div>
                <div className="pm-header-txt">
                    <div className='pm-header-loading-h3'><SkeletonLoader /></div>
                    <div className='pm-header-loading-span'><SkeletonLoader /></div>
                </div>
            </header>
            <main className="pM-main">
                <div className="pm-nav">
                    <div className="pm-nav-router pm-nav-loading"><SkeletonLoader /></div>
                    <div className="pm-nav-router pm-nav-loading"><SkeletonLoader /></div>
                    <div className="pm-nav-router pm-about pm-nav-loading"><SkeletonLoader /></div>
                </div>
                <div className="PM__Main">

                    <div className={`PM__Posts`}><FeedsListsLoading /></div>

                    <div className={`PM__About`}>
                        <div className="pm-about">
                            <div className='pm-subtopic-loading'><SkeletonLoader /></div>
                            <div className="pm-about-txt-loading"><SkeletonLoader /></div>
                            <div className="pm-about-txt-loading"><SkeletonLoader /></div>
                            <div className="pm-about-txt-loading"><SkeletonLoader /></div>
                            
                            <div className="joined-at pm-about-txt-loading"><SkeletonLoader /></div>
                            <div className="pm-about-txt-loading"><SkeletonLoader /></div>
                        </div>
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
                        </div>
                        <div className="pm-topics">
                            <div className='pm-subtopic-loading'><SkeletonLoader /></div>
                            <div className="pmt">
                                <div className="pmt_">
                                    {interests.map((val, idx) => (
                                        <div className="pmt-div pmt-div-loading" key={`pmt-${idx}`}>
                                            <div className='pmt-loading'><SkeletonLoader /></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ProfileHomeLoading;