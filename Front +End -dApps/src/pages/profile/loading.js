import './profile.css';
import SkeletonLoader from '../../component/skeleton';

const ProfileLoading = () => {

    const lists = Array(5).fill(0);

    return (
        <ul className='p-posts'>
            {lists.map((val, idx) => (
                <li key={`posts-${idx}`} className='p-posts-li'>
                    <div className='pp-icon loading'><SkeletonLoader /></div>
                    <div className='p-posts-upvotes'>
                        <div className='ppu-icon ppu-icon-loading'><SkeletonLoader /></div>
                        <div className='ppu-cnt ppu-loading'><SkeletonLoader /></div> 
                    </div>
                    <div className='pp-title pp-loading'><SkeletonLoader /></div> 
                    <div className='pp-date pp-loading'><SkeletonLoader /></div> 
                </li>
            ))}
        </ul>
    );
};

export default ProfileLoading;