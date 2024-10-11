import './wallet.css';
import SkeletonLoader from "../../component/skeleton";

const WalletLoading = () => {

    const lists = Array(5).fill(0);
    return (
        <ul>
            {lists.map((val, idx) => (
                <li key={`hist-${idx}`} className='wh-li'>
                    <div className='whl-img whli-loading'>
                        <div className='whl-icon whli-loading'><SkeletonLoader /></div>
                    </div>
                    <div className='whl-txt'>
                        <div className='whl-type whl-loading'><SkeletonLoader /></div>
                        <div className='whl-address whl-loading'><SkeletonLoader /></div>
                    </div>
                    <div className='whl-det'>
                        <div className='whl-amount whld-loading'><SkeletonLoader /></div>
                        <div className='whl-time whld-loading'><SkeletonLoader /></div>
                    </div>
                </li>
            ))}
        </ul>
    );
};

export default WalletLoading;