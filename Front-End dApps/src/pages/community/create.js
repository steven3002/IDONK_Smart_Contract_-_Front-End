import { useEffect, useMemo, useState } from 'react';
import './create.css';
import { AiOutlineClose } from 'react-icons/ai';
import { MdArrowBack, MdEdit, MdOutlineArrowDropDown, MdSend } from "react-icons/md";
import { useNavigate } from 'react-router-dom';
import MultiChoiceInputWithDropdown from '../../component/multiChoice';
import { createCommunitiesContractInstance } from '../../services/contracts_creators';
import { delay, parseCommunityData, setMessageFn } from '../../utils';
import { setMessage } from '../../store/message';
import { addCommunity } from '../../store/community';
import { useDispatch, useSelector } from 'react-redux';
import { bindActionCreators } from 'redux';
import { COMMUNITY_TOPICS, MB } from '../../config';
import { sendProfileFile } from '../../services';

const CommunityCreate = ({ closeModal }) => {

    const topicLists = COMMUNITY_TOPICS;
    const [data, setData] = useState({ topics: [] });
    const [dropdown, setDropdown] = useState(null);
    const [loading, setLoading] = useState(false);
    const [aux, setAux] = useState('');
    const [profileFile, setProfileFile] = useState({});
    const [bannerFile, setBannerFile] = useState({});

    const navigate = useNavigate();
    const dispatch = useDispatch();
    const contract = useSelector(state => state.contract);
    const user = useSelector(state => state.user);
    const addCommunityData = bindActionCreators(addCommunity, dispatch);
    const setMessageData = bindActionCreators(setMessage, dispatch);

    function selectTopicFn(value, type='topics') {
        setData({ ...data, [type]: [...value] });
        setDropdown(null);
    };

    // Don't delete incase we add admins
    // function selectAdminFn(value, type='admins') {
    //     setData({ ...data, [type]: [...data[type], value] });
    //     setDropdown(null);
    // };

    function handleChange(e) {
        const { name, value } = e.target;
        setData({ ...data, [name]: value });
    };

    const uploadCommunityFile = async (req_data) => {
        if(req_data.name) {
            const formData = new FormData();
            formData.append('file', req_data);
            formData.append('filename', req_data.name);

            const resp_data = await sendProfileFile(formData);
            const secure_url = resp_data.data.data.secure_url;
            const public_id = resp_data.data.data.public_id;
            return { secure_url, public_id };
        }
        return null;
    };

    const handleCreate = async () => {
        if(loading) return;

        setLoading(true);
        try {
            const communityContractInstance = await createCommunitiesContractInstance(contract.signer);
            const permitCreate = await communityContractInstance.nameTaken(data.name);
            if(permitCreate) {
                setLoading(false);
                return setMessageFn(setMessageData, { status: 'error', message: 'Name is taken already. Choose another.'});
            }
            
            const unFilled = Object.keys(data).find(key => !data[key]);
            if(unFilled || data.topics.length === 0) {
                setLoading(false);
                return setMessageFn(setMessageData, { 
                    status: 'error', 
                    message: `Please fill the ${unFilled || 'topics'} form`
                });
            }
            
            if(!profileFile.name || !bannerFile.name) {
                setLoading(false);
                return setMessageFn(setMessageData, { 
                    status: 'error', 
                    message: `Please choose a ${!profileFile.name ? 'Profile' : 'Banner'} picture`
                });
            }
            const profile = await uploadCommunityFile(profileFile);
            const banner = await uploadCommunityFile(bannerFile);

            const profileStr = `profile_url=${profile.secure_url}%x2profile_pubilc_id=${profile.public_id}`;
            const str = `${profileStr}%x2banner_url=${banner.secure_url}%x2banner_public_id=${banner.public_id};`;

            const stringifiedData = `[name=${data.name}%x2niche=${data.niche}%x2${str}%x2topics=[${data.topics}]%x2description=${data.description}]`;
            await communityContractInstance.createCommunity(data.name, stringifiedData);

            // just to pad and make data porpagated
            const date = Math.floor(new Date().getTime() / 1000);
            const resp = `{"creator":"${contract.address}","name":"${data.name}","meta_data":"${stringifiedData}","numbers of members":"1","created_at":${date}}`;
            
            const community_id = await communityContractInstance.getLastIndex();
            
            const communityData = parseCommunityData(resp);
            addCommunityData({ ...communityData, community_id: community_id+1n+'', creator: user.name, isMember: true });
            setLoading(false); 
            setMessageFn(setMessageData, { status: 'success', message: 'Community created successfully.' });
            closeModal();
        } catch (err) {
            setLoading(false); 
            setMessageFn(setMessageData, { status: 'error', message: 'There was an error. Check internet and try again.'});
        }
    };

    useEffect(() => {
        return () => {
            if(profileFile.name) URL.revokeObjectURL(profileFile);
            if(bannerFile.name) URL.revokeObjectURL(bannerFile);
        };
    }, []);

    const profileURL = useMemo(() => {
        if(profileFile.name) return URL.createObjectURL(profileFile);
    }, [profileFile.name]);

    const bannerURL = useMemo(() => {
        if(bannerFile.name) return URL.createObjectURL(bannerFile);
    }, [bannerFile.name]);

    function handleProfileFileChange(e) {
        if(profileFile.name) URL.revokeObjectURL(profileFile);
        const file = e.target.files[0];
        if(!file?.size) return;
        if(file.size > (MB * 1024 * 1024)) {
            return setMessageFn(setMessageData, { status: 'error', message: `File cannot be more than ${MB}MB` });
        }
        setProfileFile(file);
    };
    
    function handleBannerFileChange(e) {
        if(bannerFile.name) URL.revokeObjectURL(bannerFile);
        const file = e.target.files[0];
        if(!file?.size) return;
        if(file.size > (MB * 1024 * 1024)) {
            return setMessageFn(setMessageData, { status: 'error', message: `File cannot be more than ${MB}MB` });
        }
        setBannerFile(file);
    };

    return (
        <div className='community-Create'>
            <div className='community-Create-header'>
                <MdArrowBack className='cch-icon cursor' onClick={() => closeModal()} />
                <h1>Create Community</h1>
            </div>
            <div className='cmtc-fields'>

                <div className="cmtc-field cmtc-file">
                    <label>{`Add profile picture (not more than ${MB}MB in size)`}</label>
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
                
                <div className="cmtc-field cmtc-file">
                    <label>{`Add banner picture (not more than ${MB}MB in size)`}</label>
                    <div className='cmtc-banner-file'>
                        {
                            bannerFile.name ? 
                            <img src={bannerURL} alt='banner-img' /> :
                            <div className='cmtc-banner-placeholder'></div>
                        }
                        <label htmlFor="cmtc-banner-file" className="cmtcf-edit cursor">
                            <MdEdit className="cmtci-icon" />
                        </label>
                        <input type="file" id="cmtc-banner-file" onChange={handleBannerFileChange} accept='image/*'/>
                    </div>
                </div>

                <div className='cmtc-field'>
                    <label>Community Name</label>
                    <input placeholder='Name' name='name' onChange={handleChange} />
                </div>
                <div className='cmtc-field'>
                    <label>Community Category</label>
                    <input placeholder='Category like Sports, Entertainment etc' name='niche' onChange={handleChange} />
                </div>
                <div className='cmtc-field'>
                    <label>Community description</label>
                    <textarea placeholder='Description' name='description' onChange={handleChange} />
                </div>
                <div className='cmtc-field'>
                    <label>Topics</label>
                    <MultiChoiceInputWithDropdown class_name={"cmtc-select"} placeholder={'Select some topics'}
                    dropdownLists={topicLists} selected={data.topics} selectFn={selectTopicFn} height={200} />
                    
                </div>

                {/* No Admins for now */}
                {/* <div className='cmtc-field'>
                    <label>Community Admins</label>
                    <MultiChoiceInputWithDropdown class_name={"cmtc-select"} placeholder={'Select some admins'}
                    dropdownLists={userLists} selected={data.admins} selectFn={selectAdminFn} height={200} />

                </div> */}
            </div>
            <div className='community-create'>
                <div className='cmt-create-btn cursor' onClick={() => handleCreate()}>
                    {loading ? 'Creating...' : 'Create'}
                </div>
            </div>
        </div>
    );
};

export default CommunityCreate;