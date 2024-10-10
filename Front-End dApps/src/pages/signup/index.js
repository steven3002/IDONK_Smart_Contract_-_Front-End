import { useEffect, useMemo, useState } from 'react';
import MultiChoiceInputWithDropdown from '../../component/multiChoice';
import banner from '../../images/phone_banner.png';
import logo from '../../images/idonk_no_bg_1.png';
import './styles.css';
import { createERC20ContractInstance, createSafeUserRegistrationContractInstance, createUserContractInstance } from '../../services/contracts_creators';
import { useDispatch, useSelector } from 'react-redux';
import { setUser } from '../../store/user';
import { bindActionCreators } from 'redux';
import { useNavigate } from 'react-router-dom';
import { decodeData, encodeToByte, getTokenAmount, setMessageFn } from '../../utils';
import { setMessage } from '../../store/message';
import { setWallet } from '../../store/wallet';
import { setContract } from '../../store/contract';
import { BrowserProvider } from 'ethers';
import { MB, USER_INTERESTS } from '../../config';
import { sendProfileFile } from '../../services';
import { MdEdit } from 'react-icons/md';

const Signup = () => {
    const lists = USER_INTERESTS;
    const [user, setUserChoice] = useState({ interests: [] });
    const contract = useSelector(state => state.contract);
    const [loading, setLoading] = useState(false);
    const [profileFile, setProfileFile] = useState({});

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const setUserData = bindActionCreators(setUser, dispatch);
    const setContractData = bindActionCreators(setContract, dispatch);
    const setWalletData = bindActionCreators(setWallet, dispatch);
    const setMessageData = bindActionCreators(setMessage, dispatch);

    function selectFn(values) {
        setUserChoice({ ...user, interests: values });
    };

    function handleChange(e) {
        const { name, value } = e.target;
        setUserChoice({ ...user, [name]: value });
    };

    
    useEffect(() => {
        return () => {
            if(profileFile.filename) URL.revokeObjectURL(profileFile);
        }
    }, []);

    async function handleSubmit(e) {
        e.preventDefault();
        if(loading) return;

        setLoading(true);

        try { 

            let signer_val = contract.signer;
            let address = contract.address;

            if(!contract.signer) {
                if(!window.ethereum) {
                    setLoading(false);
                    setMessageFn(setMessageData, { status: 'error', message: 'No wallet found. Install metamask wallet.'});
                    return;
                }

                const provider = await new BrowserProvider(window.ethereum);
                const signer = await provider.getSigner();
                const signerAddress = await signer_val.getAddress();
                address = signerAddress;
                signer_val = signer;
                setContractData({ signer, address: signerAddress });
            }
   
            if(!profileFile.name) {
                const reply = await prompt('No picture selected. Proceed anyways. Y or N ?');
                if(reply !== 'Y') return setLoading(false);
            }
            let [ secure_url, public_id ] = ['', ''];
            if(profileFile.name) {
                const formData = new FormData();
                formData.append('file', profileFile);
                formData.append('filename', profileFile.name);

                const { data } = await sendProfileFile(formData);
                secure_url = data.data.secure_url;
                public_id = data.data.public_id;
            }

            const data = encodeToByte(
                JSON.stringify({ 
                    email: user.email, secure_url,
                    about: user.about, public_id,
                    interests: user.interests 
                })
            );
            
            const userContractInstance = await createUserContractInstance(signer_val);
            const nameTaken = await userContractInstance.nameTaken(user.name);
            if(nameTaken) {
                setLoading(false);
                setMessageFn(setMessageData, { status: 'error', message: 'Name is already taken. Choose another please.'});
                return;
            }

            const safeUserRegContractInstance = await createSafeUserRegistrationContractInstance(signer_val);
            await userContractInstance.registerUser(`${user.name}`, data);
            await safeUserRegContractInstance.registerUser();
            const res = await userContractInstance.getMetaData(address);
            const userRes = JSON.parse(res);
            const metaData = decodeData(userRes.metaData, 'bytes');

            const walletContractInstance = await createERC20ContractInstance(signer_val);
            const resWallet = await walletContractInstance.balanceOf(address);
            const name = await walletContractInstance.name();
            const symbol = await walletContractInstance.symbol();
            const decimals = await walletContractInstance.decimals();
            const resAmt = getTokenAmount(resWallet);
            
            // decimals is BigInt
            setWalletData({ amount: resAmt, symbol, decimals, name, actualAmount: resWallet });
            setUserData({ ...userRes, ...metaData });
            navigate('/app');
            setLoading(false);
        } catch (err) {
            setLoading(false);
            setMessageFn(setMessageData, { status: 'error', message: 'There was an error. Check internet and try again.'});
        }
    };
    
    const profileURL = useMemo(() => {
        if(profileFile.name) return URL.createObjectURL(profileFile);
    }, [profileFile.name]);

    function handleProfileFileChange(e) {
        if(profileFile.name) URL.revokeObjectURL(profileFile);
        const file = e.target.files[0];
        if(!file?.size) return;
        if(file.size > (MB * 1024 * 1024)) {
            return setMessageFn(setMessageData, { status: 'error', message: `File cannot be more than ${MB}MB` });
        }
        setProfileFile(file);
    };

    return (
        <div className='signup'>
            <div className='sign-up'>
                <main>
                    <div className='signup-content'>
                        <div className='signup-logo'>
                            <img src={logo} alt='logo' />
                        </div>
                        <h3>Set up Account</h3>
                        <p>Note that records here cannot be modified later on</p>

                        <form className='signup-form' onSubmit={handleSubmit}>

                            <div className="sf-filed cmtc-field cmtc-file">
                                <label>{`Add File (either image or document file not more than ${MB}MB in size)`}</label>
                                <div className='cmtc-profile-file'>
                                    {
                                        profileFile.name ? 
                                        <img src={profileURL} alt='profile-img' /> :
                                        <div className='cmtc-profile-placeholder'>
                                            Pick a pic
                                        </div>
                                    }
                                    <label htmlFor="cmtc-profile-file" className="cmtcf-edit cursor">
                                        <MdEdit className="cmtci-icon" />
                                    </label>
                                    <input type="file" id="cmtc-profile-file" onChange={handleProfileFileChange} accept='image/*'/>
                                </div>
                            </div>

                            <div className='sf-filed'>
                                <label>Username</label>
                                <input placeholder='Enter username' name='name' onChange={handleChange} />
                            </div>
                            <div className='sf-filed'>
                                <label>E-mail</label>
                                <input placeholder='Enter email' name='email' type='email' onChange={handleChange} />
                            </div>
                            <div className='sf-filed'>
                                <label>About</label>
                                <textarea placeholder='Write a description about your self' name='about' onChange={handleChange} />
                            </div>
                            <div className='sf-filed'>
                                <label>Interests</label>
                                <div className='sf-drp'>
                                    <MultiChoiceInputWithDropdown class_name={'sf-filed-input'} placeholder={'Select your interests'}
                                    dropdownLists={lists} selected={user.interests} selectFn={selectFn} />
                                </div>
                            </div>
                            <div className='sf-submit'>
                                <input type='submit' value={loading ? 'Creating Account...' : 'Create Account'} className='cursor' />
                            </div>
                        </form>
                    </div>
                </main>
                <aside className='signup-banner'>
                    <div className='sb'>
                        <img src={banner} alt='banner' />
                        <div className='sb-txt'>
                            <h1>The Best Decentralized<br />Knowledge Verification Platform.</h1>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default Signup;