import './styles.css';
import noData from '../images/no data.jpg';

const NoData = ({ text }) => {

    return (
        <div className="noData">
            <div className="noData-img">
                <img src={noData} alt='no-data' />
            </div>
            <h3>{text}</h3>
        </div>
    )
};

export default NoData;