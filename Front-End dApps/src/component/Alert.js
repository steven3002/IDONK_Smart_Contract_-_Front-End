import { MdError } from 'react-icons/md';
import './styles.css';
import { FaCircleCheck } from 'react-icons/fa6';

const Alert = ({ data }) => {

    return (
        <div className={`__Alert__ ${data.message ? true : false}`}>
            <div className='Alert'>
                {
                    data.status === 'error' ?
                    <MdError className='alert-icon alert-error' /> :
                    <FaCircleCheck className='alert-icon alert-success' />
                }
                <span className='alert-txt'>{data.message}</span>
            </div>
        </div>
    );
};

export default Alert;