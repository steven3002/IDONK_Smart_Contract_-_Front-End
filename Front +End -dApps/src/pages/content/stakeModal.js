import { useRef, useEffect, useState } from 'react';
import { AiOutlineClose } from 'react-icons/ai';
import './postModal.css';
import { MdSend } from 'react-icons/md';
import { createERC20ContractInstance, createVotesContractInstance, parseBigInt } from '../../services/contracts_creators';
import { useDispatch, useSelector } from 'react-redux';
import { getTokenAmount, multiplyBigDecimals, setMessageFn, subtractBigDecimals } from '../../utils';
import { BiDownvote, BiSolidDownvote, BiSolidUpvote, BiUpvote } from 'react-icons/bi';
import { bindActionCreators } from 'redux';
import { setWallet } from '../../store/wallet';
import SkeletonLoader from '../../component/skeleton';

const StakeContentModal = ({ closeModal, content_id, community_id, setMessageData, setUserVoteTypeFn }) => {

    const modalRef = useRef();
    const [loading, setLoading] = useState(false);
    const [vote, setVote] = useState(0);
    const [stake, setStake] = useState(0);
    const [walletLoading, setWalletLoading] = useState(true);
    const contract = useSelector(state => state.contract);
    const wallet = useSelector(state => state.wallet);

    const dispatch = useDispatch();
    const setWalletData = bindActionCreators(setWallet, dispatch);

    function clickFn(e) {
        if(!modalRef.current) return;
        if(modalRef.current && !modalRef.current.contains(e.target)) closeModal(); 
    };

    const fetchWalletBalance = async () => {
        setWalletLoading(true);
        try {
            // let wallet fetch but put current value (if we have it) as placeholder
            if(wallet.amount) setWalletLoading(false);
            const walletContractInstance = await createERC20ContractInstance(contract.signer);
            const res = await walletContractInstance.balanceOf(contract.address);
            // res is type bigInt
            const name = await walletContractInstance.name();
            const symbol = await walletContractInstance.symbol();
            const decimals = await walletContractInstance.decimals();
            const resAmt = getTokenAmount(res);
            // decimals is BigInt
            setWalletData({ amount: resAmt, symbol, decimals, name, actualAmount: res });
            setWalletLoading(false);
        } catch (err) {
            setWalletLoading('error');
            setMessageFn(setMessageData, { status: 'error', message: 'Error fetching wallet data. Check internet and retry' });
        }
    };
    
    const voteOnContent = async () => {
        if(!vote || !stake) {
            return setMessageFn(setMessageData, { 
                status: 'error', 
                message: `Please ${!vote ? 'Choose a vote type' : 'Enter an amount to stake on you vote'}`
            });
        };

        if(stake.toString().replace('.', '').length > 10) return setMessageFn(setMessageData, {
            status: 'error', message: 'Stake amount has more than 10 digits.'
        });

        if(!wallet.symbol) return setMessageFn(setMessageData, {
            status: 'error', message: 'No wallet data found.'
        });

        const bigIntAmount = parseBigInt(multiplyBigDecimals(stake));

        if(bigIntAmount > wallet.actualAmount) {
            return setMessageFn(setMessageData, { status: 'error', message: 'Insufficient funds.' });
        }

        if(loading) return setMessageFn(setMessageData, { status: 'error', message: 'Currently making the request already.'});

        try {
            setLoading(true);
            const votesContractInstance = await createVotesContractInstance(contract.signer);
            await votesContractInstance.voteContent((community_id||0)-0, bigIntAmount, content_id-0, vote);
            const date = Math.floor(new Date().getTime() / 1000);
            setUserVoteTypeFn({ voters_id: contract.address, stake: bigIntAmount+'', time_stamp: date }, vote);

            const new_wallet_amt = subtractBigDecimals(wallet.actualAmount, bigIntAmount);
            const resAmt = getTokenAmount(new_wallet_amt);
            setWalletData({ amount: resAmt, actualAmount: resAmt });

            setMessageFn(setMessageData, { status: 'success', message: 'Voted successfully.'});
            setLoading(false);
            closeModal();
        } catch (err) {
            setLoading(false);
            setMessageFn(setMessageData, { status: 'error', message: 'There was an error. Please try again.'});
        }
    };

    useEffect(() => {
        fetchWalletBalance();
        document.addEventListener("click", clickFn, true);

        return () => document.removeEventListener("click", clickFn, true);
        
    }, []);

    return (
        <div className='stakeContentModal'>
            <div className='scm-content' ref={modalRef}>
                <div className='scm-header'>
                    <div className="pMc-top">
                        <span className="pMct-txt">Stake on your vote</span>
                        <AiOutlineClose className="pMc-icon cursor" onClick={() => closeModal()} />
                    </div>
                </div>
                <div className='scm-main'>
                    {/* this code is very correct */}
                    {
                        wallet.amount ?

                        <h4>Your Balance: {wallet.amount+' '+wallet.symbol}</h4> :

                        walletLoading === true ?

                        <div className='scmm-wallet-loading'>Your Balance: <div><SkeletonLoader /></div></div> :

                        <div className='scmm-wallet-loading retry-wallet'><div onClick={fetchWalletBalance}>Retry</div></div> 
                    }
                    <p>Note that your vote/stake cannot be revoked or changed later</p>
                    <div className='scm-vote'>
                        <div className={`scmv ${vote === 1}`} onClick={() => setVote(1)}>
                            {vote === 1 ?
                                <BiSolidUpvote className="scmv-icon" /> :
                                <BiUpvote className="scmv-icon" /> 
                            }
                            <span>Up vote</span>
                        </div>
                        <div className={`scmv ${vote === -1}`} onClick={() => setVote(-1)}>
                            {vote === -1 ?
                                <BiSolidDownvote className="scmv-icon" /> :
                                <BiDownvote className="scmv-icon" />
                            }
                            <span>Down vote</span>
                        </div>
                    </div>
                    <div className="pMc-field">
                        <label>Stake an amount on {vote === 1 ? 'up' : ( vote === -1 ? 'down' : '' )}vote (not more than 10 digits)</label>
                        <input placeholder="Enter an amount" type='number' onChange={(e) => setStake(e.target.value)} />
                    </div>
                </div>
                <div className="pMc-base" style={{marginTop: '45px'}}>
                    <div className="pMc-send cursor" onClick={voteOnContent}>
                        <MdSend className="pMcs-icon" />
                        <span className="pMcs-txt">{loading ? 'Staking...' : 'Stake'}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StakeContentModal;