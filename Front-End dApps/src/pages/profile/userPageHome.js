import ErrorPage from '../../component/error';
import FeedsLists from '../../component/feedsLists';
import FeedsListsLoading from '../../component/feedsListsLoading';
import NoData from '../../component/nodata';
import './home.css';

const UserPageHome = ({ route, error, loading, fetchUser, feedsData, setContentId }) => {
    
    return(
        <div className={`PM__Posts-div ${route!=='About'}`}>
            {
                error ?

                <ErrorPage refreshFn={fetchUser} /> :

                loading ?

                <FeedsListsLoading /> :

                feedsData.length === 0 ?

                <div className="PM__Posts__NoData">
                    <NoData text={`No ${route} yet.`} />
                </div> :

                <FeedsLists feeds={feedsData} community={true}
                navToContentPage={(content_id) => setContentId(content_id)} />
            }
        </div>
    );
};

export default UserPageHome;