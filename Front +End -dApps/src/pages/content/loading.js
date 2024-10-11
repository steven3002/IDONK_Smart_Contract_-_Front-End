import './contentList.css';
import SkeletonLoader from "../../component/skeleton";

const ContentLoading = () => {

    const lists = Array(5).fill(0);

    return (
        <ul className='post-ul'>
            {lists.map((val, idx) => (
                <li className='post-list' key={`pl-${idx}`}>
                    <div className='pl-top'>
                        <div className='pl-img'><SkeletonLoader /></div>
                        <div className='pl-txt pl-loading'><SkeletonLoader /></div>
                        <div className='post-time pl-loading'><SkeletonLoader /></div>
                    </div>
                    <div className="pl-mid plm-loading"><SkeletonLoader /></div>
                    <div className='pl-base'>
                        <div className='pl-groupings'>
                            <div className='plg-loading'><SkeletonLoader /></div> 
                        </div>
                        <div className='plv-loading'><SkeletonLoader /></div> 
                    </div>
                </li>
            ))}
        </ul>
    );
};

export default ContentLoading;