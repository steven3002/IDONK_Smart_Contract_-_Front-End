import { useRef, useEffect, useState, useMemo } from "react";
import { EditorState } from "draft-js";
import { Editor } from "react-draft-wysiwyg";
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";
import { AiOutlineClose, AiOutlineSearch } from 'react-icons/ai';
import { MdEdit, MdOutlineArrowDropDown, MdSend } from "react-icons/md";
import '../content/postModal.css';
import MultiChoiceInputWithDropdown from "../../component/multiChoice";
import { useSelector, useDispatch } from 'react-redux';
import { bindActionCreators } from 'redux';
import { FaFile } from "react-icons/fa6";
import { generateHTMLString, getTokenAmount, multiplyBigDecimals, parseContentData, setMessageFn, subtractBigDecimals } from "../../utils";
import { setMessage } from "../../store/message";
import { postingContent } from "../../store/contents";
import { sendFile } from "../../services";
import { MB, POST_TAGS } from "../../config";
import { createContentCreatorContractInstance, createUserContractInstance, createVotesContractInstance, parseBigInt } from "../../services/contracts_creators";
import { setWallet } from "../../store/wallet";

// destination is communityName if we are coming from a community

const CommunityPostModal = ({ closeModal, destination, community_id, setFeeds, feeds }) => {

    const dispatch = useDispatch();
    const setMessageData = bindActionCreators(setMessage, dispatch);
    const setWalletData = bindActionCreators(setWallet, dispatch);
    const postContentData = bindActionCreators(postingContent, dispatch);

    const contract = useSelector(state => state.contract);
    const wallet = useSelector(state => state.wallet);

    const modalRef = useRef();
    const [editorState, setEditorState] = useState(EditorState.createEmpty());
    const [open, setOpen] = useState(true);
    const [sendLoading, setSendLoading] = useState(false);
    const [title, setTitle] = useState('');
    const [stake, setStake] = useState(0);
    const [postContent, setPostContent] = useState({});
    const [postFile, setPostFile] = useState({});
    const [selected, setSelected] = useState([]);
    const [postDestination, setPostDestination] = useState(destination||'Your feed');
    const [postDestinationDropdown, setPostDestinationDropdown] = useState(false);
    const dropdownRef = useRef();
    const selectRef = useRef();
    const sendLoadingRef = useRef(false);
    const options = POST_TAGS;

    function clickFn(e) {
        if(!modalRef.current) return;
        if(modalRef.current && !modalRef.current.contains(e.target)) { 
            // ensure sendLoading is done before user can leave this page
            if(sendLoadingRef.current) return setMessageFn(setMessageData, { status: 'error', message: `Wait till request is done` });
            setOpen(false); 
            closeModal(); 
        }

        if(!selectRef.current || !dropdownRef.current) return;
        if(selectRef.current && !selectRef.current.contains(e.target) && !dropdownRef.current.contains(e.target)) {
            setPostDestinationDropdown(false);
        }
    };

    function postDestinationFn(val) {
        setPostDestinationDropdown(false);
        setPostDestination(val);
    };

    function selectFn(selectedArr) {
        setSelected(selectedArr);
    };

    useEffect(() => {
        document.addEventListener("click", clickFn, true);

        return () => {
            if(postFile?.type && postFile.type.startsWith('image/')) URL.revokeObjectURL(postFile);
            document.removeEventListener("click", clickFn, true);
        }
    }, []);

    function handleFileChange(e) {
        const file = e.target.files[0];
        if(!file?.size) return;
        if(file.size > (MB * 1024 * 1024)) {
            return setMessageFn(setMessageData, { status: 'error', message: `File cannot be more than ${MB}MB` });
        }
        if(postFile?.type?.startsWith('image/')) URL.revokeObjectURL(postFile);
        setPostFile(file);
    };

    const getImageURL = useMemo(() => {
        if(postFile.type && postFile.type.startsWith('image/')) return URL.createObjectURL(postFile);
        return null;
    }, [postFile.name]);

    function handleChange(e) {
        setPostContent(e);
    };

    const handleSend = async () => {
        if(sendLoading) return setMessageFn(setMessageData, { status: 'error', message: 'Currently sending a request.' });

        setSendLoading(true);
        sendLoadingRef.current = true;

        if(!title || !stake || selected.length === 0 || !postContent.blocks[0].text) {
            setSendLoading(false);
            sendLoadingRef.current = false;
            return setMessageFn(setMessageData, { status: 'error', 
                message: `Please fill the ${!title ? 'title' : !stake ? 'stake' : selected.length === 0 ? 'tags' : 'content'} form` 
            });
        }

        
        try {
            // wallet data would have been updated by now
            // and everywhere we might update it to backend
            // it is also updated in redux-state
            const bigIntAmount = parseBigInt(multiplyBigDecimals(stake));
    
            if(bigIntAmount > wallet.actualAmount) {
                return setMessageFn(setMessageData, { status: 'error', message: 'Insufficient funds.' });
            }

            let [secure_url, public_id, filename, filesize, file_type] = ['', '', '', '', ''];
            if(postFile?.size) {
                const formData = new FormData();
                formData.append('file', postFile);
                formData.append('filename', postFile.name);
                formData.append('file_type', postFile.type.startsWith('image/') ? 'image' : 'doc');

                const { data } = await sendFile(formData);
                secure_url = data.data.secure_url;
                public_id = data.data.public_id;
                filename = postFile.name;
                filesize = data.data.filesize
                file_type = data.data.file_type;
            }
            const sub_data = {
                secure_url, public_id, content: generateHTMLString(postContent),
                filename, tags: selected, title, filesize, file_type
            }

            const contractInstance = await createContentCreatorContractInstance(contract.signer);
            // if user has not adjusted postDestination to Your feed then
            // if we are from community page, postDestination will be community name
            // so use community id, but if user has changed its destination to feed
            // then community_id argument should be 0
            const cnt_id = await contractInstance.getDraft();

            // %x2 rep comma ','
            const stringifiedData = `[secure_url=${sub_data.secure_url}%x2public_id=${sub_data.public_id}%x2content=${sub_data.content}%x2filename=${sub_data.filename}%x2tags=[${sub_data.tags}]%x2title=${sub_data.title}%x2file_type=${sub_data.file_type}%x2filesize=${sub_data.filesize}]`;
            await contractInstance.addContent(
                stringifiedData, 
                '', 
                postDestination === 'Your feed' ? 0 : community_id || 0
            );

            let content_id = cnt_id;

            while(content_id == cnt_id) {
                await new Promise((resolve) => setTimeout(resolve, 2000));
                content_id = await contractInstance.getDraft();
            }

            const cmmty_id = postDestination === 'Your feed' ? 0 : community_id || 0;
            const date = Math.floor(new Date().getTime() / 1000);

            const duplicate_contentData = `{"content_id":"${content_id+''}","author":"${contract.address}","sub_data":"${stringifiedData}","content":"","community_id":"${cmmty_id}","verified":false,"timestamp":${date}}`;

            const res = parseContentData(duplicate_contentData);

            const userContractInstance = await createUserContractInstance(contract.signer);
            const author = await userContractInstance.getUsername(res.author);

            const votesContractInstance = await createVotesContractInstance(contract.signer);
            setMessageFn(setMessageData, { status: 'success', message: 'Now voting on post...' });
            await votesContractInstance.voteContent((cmmty_id)-0, bigIntAmount, (content_id+'')-0, 1);

            // do not try to set wallet data on backend because voteContent already does that
            // only just set the redux state for future use
            const new_wallet_amt = subtractBigDecimals(wallet.actualAmount, bigIntAmount);
            const resAmt = getTokenAmount(new_wallet_amt);
            setWalletData({ amount: resAmt, actualAmount: resAmt });

            if(postDestination === 'Your feed') postContentData({ ...res, author });
            else setFeeds([{ ...res, author }, ...feeds]);

            setMessageFn(setMessageData, { status: 'success', message: 'Post sent successfully.' });
            sendLoadingRef.current = false;
            closeModal(); 
        } catch(err) {
            setSendLoading(false);
            sendLoadingRef.current = false;
            setMessageFn(setMessageData, { status: 'error', message: 'Error sending your post. Retry.' });
        }
    };
    

    return (
        <div className={`postModal ${open}`}>
            <div className="pM-content" ref={modalRef}>
                <div className="pMc-top">
                    <span className="pMct-txt">Add Post</span>
                    <AiOutlineClose className="pMc-icon cursor" onClick={() => closeModal()} />
                </div>
                <div className="pMc-mid">
                    <div className="pMc-destination">
                        <div className="pMc-dest" ref={selectRef}>
                            <div className="pMcd-selected">
                                {!postDestinationDropdown ?
                                    <div className="pMcd-s-div" onClick={() => setPostDestinationDropdown(true)}>
                                        <div className="pMcds-img"></div>
                                        <span>{postDestination}</span>
                                        <MdOutlineArrowDropDown className="pMcds-icon" />
                                    </div> :
                                    <div className="pMcd-s-search">
                                        <AiOutlineSearch className="pMcds-icon -s" />
                                        <input placeholder="Select a community" />
                                    </div>
                                }
                            </div> 
                            {postDestinationDropdown && <div className="pMcd-dropdown" ref={dropdownRef}>
                                <div className="pmcd-dr-lists hide_scrollbar">
                                    <div>
                                        <div className="pmcd-user">
                                            <div className="pmcd-subheading">Your profile</div>
                                            <div className="pmdc-li" onClick={() => postDestinationFn('Your feed')}>
                                                <div className="pmdcl-img"></div>
                                                <div className="pmdcl-txt">
                                                    {'Your feed'}
                                                </div>
                                            </div>
                                        </div>
                                        {community_id && <div className="pmcd-communities">
                                            <div className="pmcd-subheading">Community</div>
                                            <div className="pmdc-li" onClick={() => postDestinationFn(destination)}>
                                                <div className="pmdcl-img"></div>
                                                <div className="pmdcl-txt">
                                                    {destination}
                                                </div>
                                            </div>
                                        </div>}
                                        {/* {community_id && <div className="pmcd-communities">
                                            <div className="pmcd-subheading">Your communities</div>
                                            {communities.map((val, idx) => (
                                                <div className="pmdc-li" key={`pmcdcl-${idx}`}
                                                onClick={() => postDestinationFn(val.name)}>
                                                    <div className="pmdcl-img"></div>
                                                    <div className="pmdcl-txt">
                                                        {val.name}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>} */}
                                    </div>
                                </div>
                            </div>}
                        </div>
                    </div>

                    <div className="pMc-field">
                        <label>Post title</label>
                        <input placeholder="Enter a title" required
                        onChange={(e) => setTitle(e.target.value)} />
                    </div>

                    <div className="pMc-field stake-pMc-field">
                        <label>Amount to stake on this post {wallet.amount ? `(bal. ${wallet.amount + ' '+ wallet.symbol})` : ''}</label>
                        <input placeholder="Enter an amount (not more than 10 digits)" required type="number"
                        onChange={(e) => setStake(e.target.value)} />
                    </div>
                    
                    <div className="pMc-field">
                        <label>{`Add File (either image or document file not more than ${MB}MB in size)`}</label>
                        <div className="pMc-file">
                            <label htmlFor="post-file" className="post-file-label">
                                {postFile.name && <div className="post-file-content">
                                    {
                                    postFile.type.startsWith('image/') ?
                                        <div className="file-doc-">
                                            <img src={getImageURL} alt='post-img-alt' />
                                            <div className="file-doc image-bg"></div>
                                        </div> :
                                        <div className="file-doc-">
                                            <FaFile className="fd-icon" />
                                            <div className="file-desc">{postFile.name}</div>
                                        </div>
                                    }
                                    </div>
                                }
                                {
                                    !postFile.name ?
                                    <div className="file-doc">
                                        <FaFile className="fd-icon" />
                                        <div className="file-desc">
                                            {`Select file`}
                                        </div>
                                    </div> :
                                    <div className="file-doc-edit cursor">
                                        <MdEdit className="fd-icon" />
                                    </div>
                                }
                            </label>
                            <input type="file" id="post-file" onChange={handleFileChange} />
                        </div>
                    </div>

                    <div className="pMc-field">
                        <label>Post tags</label>
                        <MultiChoiceInputWithDropdown class_name={"pMc-select"} placeholder={'Select the tags'}
                        dropdownLists={options} selected={selected} selectFn={selectFn} height={200} />

                    </div>
                    <div className="pMc-field">
                        <label>Post contents</label>

                        <Editor
                            editorState={editorState}
                            toolbarClassName="toolbarClassName"
                            wrapperClassName="wrapperClassName"
                            editorClassName="editorClassName"
                            onChange={handleChange}
                            onEditorStateChange={(eState) => setEditorState(eState)}
                        />
                        
                    </div>
                </div>
                <div className="pMc-base">
                    <div className="pMc-send cursor" onClick={() => handleSend()}>
                        <MdSend className="pMcs-icon" />
                        <span className="pMcs-txt">{sendLoading ? 'Posting...' : 'Post'}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CommunityPostModal;