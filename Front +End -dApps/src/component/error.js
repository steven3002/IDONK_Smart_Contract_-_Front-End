import { BiSolidError } from 'react-icons/bi';
import './styles.css';
import { useDispatch, useSelector } from 'react-redux';
import { useState } from 'react';
import { bindActionCreators } from 'redux';
import { setContract } from '../store/contract';
import { BrowserProvider } from 'ethers';
import { setMessage } from '../store/message';
import { decodeData, getTokenAmount, setMessageFn } from '../utils';
import { createERC20ContractInstance, createUserContractInstance } from '../services/contracts_creators';
import { useNavigate } from 'react-router-dom';
import { setUser } from '../store/user';
import { setWallet } from '../store/wallet';

const ErrorPage = ({ text, refreshFn, important, btnName, setContractRef }) => {

    const contract = useSelector(state => state.contract);
    const user = useSelector(state => state.user);
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const setContractData = bindActionCreators(setContract, dispatch);
    const setUserData = bindActionCreators(setUser, dispatch);
    const setWalletData = bindActionCreators(setWallet, dispatch);
    const setMessageData = bindActionCreators(setMessage, dispatch);

    const fireFn = async () => {
        if(loading) return;
        
        try {
            // until contract state has been updated before we now fire the refresh
            if(contract.signer) return refreshFn();
            
            setLoading(true);

            if(!contract.signer) {
        
                if (!window.ethereum) {
                    setLoading(false);
                    setMessageFn(setMessageData, { 
                        status: 'error', message: "No crypto wallet found. Please install MetaMask." 
                    });
                    return;
                }
                const provider = await new BrowserProvider(window.ethereum);
                const signer_val = await provider.getSigner();
                const signerAddress = await signer_val.getAddress();
                setContractData({ signer: signer_val, address: signerAddress });
                setContractRef({ signer: signer_val, address: signerAddress });
                const userContractInstance = await createUserContractInstance(signer_val);
                
                const isRegisteredUser = await userContractInstance.hasMetaData();
                if(!isRegisteredUser) {
                    setMessageFn(setMessageData, { status: 'error', message: 'You have not registered with us.' });
                    return navigate('/signup');
                } else {
                    const res = await userContractInstance.getMetaData();
                    const userRes = JSON.parse(res);
                    const metaData = decodeData(userRes.metaData, 'bytes');

                    const walletContractInstance = await createERC20ContractInstance(signer_val);
                    const resWallet = await walletContractInstance.balanceOf(signerAddress);
                    const name = await walletContractInstance.name();
                    const symbol = await walletContractInstance.symbol();
                    const decimals = await walletContractInstance.decimals();
                    const resAmt = getTokenAmount(resWallet);
                    
                    // decimals is BigInt
                    setWalletData({ amount: resAmt, symbol, decimals, name, actualAmount: resWallet });
                    setUserData({ ...userRes, ...metaData });
                    setMessageFn(setMessageData, { status: 'success', message: 'Welcome '+ userRes.name });
                }
            }
            setLoading(false);
        } catch (err) {
            setLoading(false);
        }
    };



    return (
        <div className='error-page'>
            <div>
                <div className='ep-iocn-div'>
                    <BiSolidError className='ep-icon' />
                </div>
                <p className='ep-h3'>
                    {!contract.signer ? 'No wallet connected. Connect your wallet to continue.' :
                    important ? (text || 'Reload') : 'There was an error loading the data. Check internet connection and Retry'}
                </p>
                <div className='ep-btn cursor' onClick={() => fireFn()}>
                    {loading ? 
                        ( !contract.signer ? 'Connecting...' : 'Retrying...' ) : 
                        ( !contract.signer ? 'Connect wallet' : btnName || 'Reload' )
                    }
                </div>
            </div>
        </div>
    );
};

export default ErrorPage;