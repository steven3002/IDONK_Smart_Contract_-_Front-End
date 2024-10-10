import { useState } from "react";
import { BrowserProvider } from "ethers";
import { MdAccountBalanceWallet } from "react-icons/md";
import "./styles.css";
import { useDispatch } from "react-redux";
import { setContract } from "../../store/contract";
import { setMessage } from "../../store/message";
import { decodeData, getTokenAmount, setMessageFn } from "../../utils";
import { useNavigate } from "react-router-dom";
import { bindActionCreators } from "redux";
import { createContentContractInstance, createERC20ContractInstance, createUserContractInstance } from "../../services/contracts_creators";
import { setUser } from "../../store/user";
import banner from '../../images/wallet.png';
import logo from '../../images/idonk_no_bg.png';
import { setWallet } from "../../store/wallet";

const LandingPage = () => {

    const [connecting, setConnecting] = useState(false);

    const navigate = useNavigate();
    const dispatch = useDispatch();
    const setContractData = bindActionCreators(setContract, dispatch);
    const setMessageData = bindActionCreators(setMessage, dispatch);
    const setUserData = bindActionCreators(setUser, dispatch);
    const setWalletData = bindActionCreators(setWallet, dispatch);

    async function loadContract() {
        
        if (!window.ethereum) {
          throw new Error("No crypto wallet found. Please install MetaMask.");
        }
        setConnecting(true);
        const provider = await new BrowserProvider(window.ethereum);
        const signer_val = await provider.getSigner();
        const signerAddress = await signer_val.getAddress();
        // const contractInstance = await new Contract(contractAddress, abi, signer_val);
        const userContractInstance = await createUserContractInstance(signer_val);
        const contentContractInstance = await createContentContractInstance(signer_val);
        setContractData({ signer: signer_val, address: signerAddress });
        
        // also fetch data using the address to check if user has set up his account well, 
        // else do return navigate('/app/profile/edit');
        const hasRegistered = await contentContractInstance.hasRegistered();
        const isRegisteredUser = await userContractInstance.hasMetaData();
        if(!hasRegistered || !isRegisteredUser) {
            setMessageFn(setMessageData, { status: 'error', message: 'You have not registered with us.' });
            return navigate('/signup');
        } else {
            const res = await userContractInstance.getMetaData(signerAddress);
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
            navigate('/app');
            setConnecting(false);
        }
    };
    
    
    function connectWallet() {
        
        if (!window.ethereum) return setMessageFn(setMessage, { status: 'error', message: 'Install Metamask extension!' });

        loadContract().catch(error => {
            if(error.message === "No crypto wallet found. Please install MetaMask.") {
                setMessageFn(setMessageData, { status: 'error', message: error.message });
            } else setMessageFn(setMessageData, { status: 'error', message: 'Error connecting wallet' });
            setConnecting(false);
        });
    };

    return (
        <div className="landingPage">
            <div className="idonk_logo">
                <img src={logo} alt="logo" />
            </div>
            <div className="landing_page_wrapper">
                <div className="lpw-content">
                    <h3>Connect Wallet</h3>
                    <p>Connect your wallet to get started</p>
                    <div className="connect-wallet-btn cursor" onClick={() => connectWallet()}>
                        <MdAccountBalanceWallet className='cwb-icon' />
                        <span className='cwb-txt'>{connecting ? 'Connecting...' : 'Connect'}</span>
                    </div>
                </div>
            </div>
            <div className="lp-banner">
                <div className="lpb-img">
                    <img src={banner} alt="banner" />
                </div>
            </div>
        </div>
    );
};

export default LandingPage;