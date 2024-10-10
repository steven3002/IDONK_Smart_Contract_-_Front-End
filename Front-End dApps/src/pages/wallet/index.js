import { useCallback, useEffect, useRef, useState } from 'react';
import { GiHamburgerMenu } from 'react-icons/gi';
import './wallet.css';
import { FaDollarSign, FaArrowDown } from 'react-icons/fa';
import { BsFillSendFill } from 'react-icons/bs';
import WalletModal from './modal';
import WalletLoading from './loading';
import NoData from '../../component/nodata';
import { useSelector, useDispatch } from 'react-redux';
import { bindActionCreators } from 'redux';
import { setWallet } from '../../store/wallet';
import { formatDate, getTokenAmount, scrolledToBottom, setMessageFn, shortenWalletAddress } from '../../utils';
import { setMessage } from '../../store/message';
import { createERC20ContractInstance, REWARDS_ADDRESS, VOTES_ADDRESS } from '../../services/contracts_creators';
import ErrorPage from '../../component/error';
import SkeletonLoader from '../../component/skeleton';
import { Contract } from 'ethers';
import { ERC20_ADDRESS } from '../../config';
import LoadingSpinner from '../../component/loadingSpinner';

const Wallet = ({ toggleSidebar }) => {

    const assertWidth = () => {
        const width = window.innerWidth;
        return width <= 600 || (width >= 770 && width <= 950);
    }
    const LIM = 50;
    const [isMobile, setIsMobile] = useState(assertWidth());
    const [modalType, setModalType] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [loadingSpinner, setLoadingSpinner] = useState(false);
    const [runningLength, setRunningLength] = useState(LIM);
    const [transactionHistoryData, setTransactionHistoryData] = useState([]);
    const stopFetchingRef = useRef(false);

    const wallet = useSelector(state => state.wallet);
    const contract = useSelector(state => state.contract);

    const dispatch = useDispatch();
    const setWalletData = bindActionCreators(setWallet, dispatch);
    const setMessageData = bindActionCreators(setMessage, dispatch);

    const fetchHistoryData = async (justUpdating = false) => {

        if(stopFetchingRef.current === true && !justUpdating) return;

        if(!stopFetchingRef.current && !justUpdating) setLoadingSpinner(true);

        try {
            const abi = [
                "event Transfer(address indexed from, address indexed to, uint256 value)"
            ]
            const newContract = new Contract(ERC20_ADDRESS, abi, contract.signer);
            const filter = newContract.filters.Transfer();
            const [start, end] = [-runningLength, -runningLength + LIM];
            const transactionRes = (
                runningLength === LIM ? 
                (await newContract.queryFilter(filter)).slice(-runningLength) : 
                (await newContract.queryFilter(filter)).slice(start, end)
            );
            // typeof transactionRes is object
            const data = [];

            // don't do .reverse() here, cus we already did it down for data array
            let i = LIM;
            for(const { args, blockNumber } of transactionRes) {
                if(!i) break;

                i--;
                const [from, to, value] = args;
                let time_stamp = '';
                
                let notUserAddress = to, op = 'T';
                if(from === contract.address || to === contract.address) {

                    await new Promise(res => setTimeout(res, 300));
               
                    const apiUrl = `https://api-sepolia.arbiscan.io/api?module=block&action=getblockreward&blockno=${blockNumber}`;
                    const res = await fetch(apiUrl);
                    const res_data = await res.json();
                    if(res_data.status === '1') {
                        const timestamp = parseInt(res_data.result.timeStamp, 10);
                        time_stamp = timestamp;
                    }

                    if(from === contract.address) {
                        notUserAddress = to;
                        op = 'T';
                    } else if(to === contract.address) {
                        notUserAddress = from;
                        op = 'R';
                    } 

                    if(notUserAddress.toLowerCase() === ERC20_ADDRESS) {
                        data.push({ type: 'IDONK', text: 'IDONK', amt: getTokenAmount(value), op, time_stamp }); 
                    } else if(notUserAddress.toLowerCase() === REWARDS_ADDRESS) {
                        data.push({ type: 'Reward', text: 'Claimed Reward', amt: getTokenAmount(value), op, time_stamp });
                    } else if(notUserAddress.toLowerCase() === VOTES_ADDRESS) {
                        data.push({ type: 'Stake', text: 'Staked on a vote', amt: getTokenAmount(value), op, time_stamp });
                    } else if(notUserAddress !== "0x0000000000000000000000000000000000000000") {
                        data.push({ 
                            amt: getTokenAmount(value), op,
                            type: op === 'T' ? 'Transferred' : 'Received', time_stamp,
                            text: `${notUserAddress}`, hasAddress: true
                        });
                    } else if(notUserAddress == "0x0000000000000000000000000000000000000000") {
                        data.push({ type: 'New User reward', text: 'IDONK', amt: getTokenAmount(value), op, time_stamp }); 
                    }
                }

            };
                
            // if i remains at LIM, then no data hence the end
            if(i === LIM) stopFetchingRef.current = true;
            
            setTransactionHistoryData([...transactionHistoryData, ...data.reverse()]);
            setLoadingSpinner(false);
            setRunningLength(runningLength + LIM);
        } catch (err) {
            throw new Error(err);
        }
    };

    const fetchWallet = async () => {
        if(!contract.signer) return setError(true);

        if(error) setError(false);
        setLoading(true);

        try {
            const walletContractInstance = await createERC20ContractInstance(contract.signer);
            const res = await walletContractInstance.balanceOf(contract.address);
            // res is type bigInt
            const name = await walletContractInstance.name();
            const symbol = await walletContractInstance.symbol();
            const decimals = await walletContractInstance.decimals();
            const resAmt = getTokenAmount(res);
            
            setWalletData({ amount: resAmt, symbol, decimals, name, actualAmount: res });
            await fetchHistoryData();
            setLoading(false);
        } catch (err) {
            setError(true);
            setLoading(false);
        }
    };
    
    function handleResize(e) {
        setIsMobile(assertWidth());
    };

    useEffect(() => {
        fetchWallet();
        window.addEventListener('resize', handleResize);

        return () =>  window.removeEventListener('resize', handleResize);
    }, []);

    const getTextData = useCallback((op, text, hasAddress) => {
        if(!hasAddress) return text;
        if(isMobile) {
            return `${op === 'T' ? 'To' : 'From'}: ${shortenWalletAddress(text)}`;
        } else return `${op === 'T' ? 'To' : 'From'}: ${text}`;
    }, [isMobile]);

    // do not remove
    function formatAmount(amount) {
        if(amount >= 1E9) return (amount / 1E9).toFixed(2) + 'B';
        else if(amount >= 1E6) return (amount / 1E6).toFixed(2) + 'M';
        else if(amount >= 1E3) return (amount / 1E5).toFixed(2) + 'K';
        else return amount;
    };

    const setModalTypeFn = (type) => {
        if(!wallet.amount) {
            setMessageFn(setMessageData, { status: 'error', message: 'Have not fetched wallet data.' });
        }
        setModalType(type);
    };
    
    return (
        <div className='Wallet'>
            <div className='wallet-header'>
                <GiHamburgerMenu className='wh-hamburger cursor' onClick={()=>toggleSidebar()} />
                <h2>Wallet</h2>
            </div>
            {
            error ?

            <div className='wallet-main-wrapper'><ErrorPage text={'Error'} refreshFn={fetchWallet} /></div> :

            <div className='wallet-main-wrapper' onScroll={(e) => scrolledToBottom(e, fetchHistoryData)}>
                <div className='wallet-details'>
                    <h4>Total Balance</h4>
                    {loading ? 
                        <div className='wallet-amount-loading'><SkeletonLoader /></div> :
                        <h1>{formatAmount(wallet.amount) + ' ' + wallet.symbol}</h1>
                    }
                </div>
                <div className='wallet-main'>
                    <div className='wallet-actions'>
                        <div>
                            <div className='wallet-action' onClick={() => setModalTypeFn('Receive')}>
                                <FaArrowDown className='wa-icons' />
                                <span>Receive</span>
                            </div>
                            <div className='wallet-action' onClick={() => setModalTypeFn('Send')}>
                                <BsFillSendFill className='wa-icons' />
                                <span>Send</span>
                            </div>
                            <div className='wallet-action' onClick={() => setModalTypeFn('Buy')}>
                                <FaDollarSign className='wa-icons' />
                                <span>Buy</span>
                            </div>
                        </div>
                    </div>
                    <div className='wallet-history'>
                        <div className='wh'>
                            <h4>Transaction history</h4>
                        </div>
                        {loading ? 
                            <WalletLoading /> :

                            transactionHistoryData.length === 0 ?
                            <NoData text={'No transaction history'} /> :

                            <ul>
                                {transactionHistoryData.map((val, idx) => (
                                    <li key={`hist-${idx}`} className='wh-li'>
                                        <div className='whl-img'>
                                            {val.op === 'T' ?
                                                <BsFillSendFill className='whl-icon' /> :
                                                <FaArrowDown className='whl-icon' /> 
                                            }
                                        </div>
                                        <div className='whl-txt'>
                                            <span className='whl-type'>{val.type}</span>
                                            <span className='whl-address'>
                                                {getTextData(val.op, val.text, val.hasAddress)}
                                            </span>
                                        </div>
                                        <div className='whl-det'>
                                            <span className='whl-amount'>{val.amt + ' ' + wallet.symbol}</span>
                                            {val.time_stamp && <span className='whl-time'>
                                                {formatDate(val.time_stamp, true)}
                                            </span>}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        }
                        {loadingSpinner && <div className='wallet-loading-spinner'>
                            <div><LoadingSpinner /></div>
                        </div>}
                    </div>
                </div>
            </div>
            }

            {modalType && <WalletModal modalType={modalType} 
            setWalletData={setWalletData} contract={contract} setMessageData={setMessageData} 
            wallet={wallet} closeModal={() => setModalType(null)} fetchHistoryData={fetchHistoryData} />}

        </div>
    );
};

export default Wallet;