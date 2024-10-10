import { useEffect, useRef, useState } from "react";
import './modal.css';
import { MdSend } from "react-icons/md";
import { FaRegCopy } from "react-icons/fa";
import { AiOutlineClose } from "react-icons/ai";
import { TOKEN_NAME } from "../../config";
import { getTokenAmount, subtractBigDecimals, setMessageFn, multiplyBigDecimals } from "../../utils";
import { createERC20ContractInstance, parseBigInt } from "../../services/contracts_creators";


const Receive = ({ contract, setMessageData }) => {
        
    const copyAddress = async () => {
        try {
            await navigator.clipboard.writeText(contract.address);
            setMessageFn(setMessageData, { status: 'success', message: 'Link copied.' });
        } catch (err) {
            setMessageFn(setMessageData, { status: 'error', message: 'Failed to copy.' });
        }
    };

    return (
        <div className="wm-Receive">
            <p>Copy your address</p>
            <div className="wmr-text">
                <span>{contract.address}</span>
            </div>
            <div className="wmr">
                <div className="wmr-button cursor" onClick={copyAddress}>
                    <FaRegCopy className="wmrb-icon" />
                    <span>Copy</span>
                </div>
            </div>
        </div>
    );
};


const Send = ({ contract, setWalletData, setMessageData, wallet, fetchHistoryData }) => {

    const [sendOptions, setSendOptions] = useState({});
    const [sendLoading, setSendLoading] = useState(false);

    function handleChange(e) {
        const { name, value } = e.target;
        setSendOptions({ ...sendOptions, [name]: value });
    };

    const sendFunds = async () => {
        // 0xa778cE308fcB1d35db8B2E40d86d979387b31965
        if(sendOptions.address === contract.address) {
            return setMessageFn(setMessageData, { status: 'error', message: 'Address cannot be your current wallet address.' });
        }

        if(sendLoading) return setMessageFn(setMessageData, { status: 'error', message: 'Currently making a transfer request.' });

        const { amount } = sendOptions;

        const bigIntAmount = parseBigInt(multiplyBigDecimals(amount));

        if(bigIntAmount > wallet.actualAmount) {
            return setMessageFn(setMessageData, { status: 'error', message: 'Insufficient funds.' });
        }

        setSendLoading(true);
        try {
            const walletContractInstance = await createERC20ContractInstance(contract.signer);
            const bool = await walletContractInstance.transfer(sendOptions.address, bigIntAmount);

            if(!bool) {
                setSendLoading(false);
                return setMessageFn(setMessageData, { status: 'error', message: 'Transfer failed.' });
            }
            
            const new_wallet_amt = subtractBigDecimals(wallet.actualAmount, bigIntAmount);
            const resAmt = getTokenAmount(new_wallet_amt);
            setWalletData({ amount: resAmt, actualAmount: resAmt });
            setMessageFn(setMessageData, { status: 'success', message: 'Transfer successful.' });
            setSendLoading(false);
            fetchHistoryData(true);
        } catch (err) {
            setSendLoading(false);
            setMessageFn(setMessageData, { status: 'error', message: 'Transfer failed. Check internet and retry.' });
        }
    };

    return (
        <div className="wm-Send">
            <p>Send tokens to an address</p>
            <div className="wmS-field">
                <label>Receipient address</label>
                <input placeholder="Enter address" name='address' onChange={handleChange} />
            </div>
            <div className="wmS-field">
                <label>Amount</label>
                <input placeholder="Enter amount" type='number' name="amount" onChange={handleChange} />
            </div>
            <div className="wmS-send">
                <div className="wms-button cursor" onClick={() => sendFunds()}>
                    <MdSend className="wmsb-icon" />
                    <span>{sendLoading ? 'Sending...' : 'Send'}</span>
                </div>
            </div>
        </div>
    );
};


const Buy = () => {

    return (
        <div className="wm-Buy">
            <h2>Coming soon...</h2>
        </div>
    );
};

const WalletModal = ({ modalType, closeModal, setWalletData, setMessageData, contract, wallet, fetchHistoryData }) => {

    const modalRef = useRef();
    

    function clickFn(e) {
        if(!modalRef.current) return;
        if(modalRef.current && !modalRef.current.contains(e.target)) closeModal(); 
    };

    useEffect(() => {
        document.addEventListener("click", clickFn, true);

        return () => document.removeEventListener("click", clickFn, true);
    }, []);


    return (
        <div className="wallet-modal">
            <div className="wm" ref={modalRef}>
                <div className="wm-header">
                    <h4>{modalType} {TOKEN_NAME}</h4>
                    <AiOutlineClose className="wmh-icon cursor" onClick={() => closeModal()} />
                </div>
                {
                    modalType === 'Receive' ? 

                    <Receive contract={contract} setMessageData={setMessageData} /> :

                    modalType === 'Buy' ? <Buy /> : 

                    <Send contract={contract} setWalletData={setWalletData} wallet={wallet} 
                    fetchHistoryData={fetchHistoryData} setMessageData={setMessageData} />
                }
            </div>
        </div>
    )
};

export default WalletModal;