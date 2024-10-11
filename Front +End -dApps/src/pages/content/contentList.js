import { useNavigate } from 'react-router-dom';
import './contentList.css';
import ContentLoading from './loading';
import { useEffect, useState } from 'react';

import { useSelector, useDispatch } from 'react-redux';
import { bindActionCreators } from 'redux';
import { setContents } from '../../store/contents';
import { formatDate, inProductionContent, parseContentData } from '../../utils';
import ContentFile from '../../component/contentFile';
// import { getData } from '../../services';
import ErrorPage from '../../component/error';
import { createContentContractInstance, createUserContractInstance } from '../../services/contracts_creators';
import { setSessions } from '../../store/sessions';
import NoData from '../../component/nodata';

const Contentlist = ({ openModal }) => {

    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    // const groupings = ['string', 'powershell', 'web3', 'ethereum'];
    const contents = useSelector(state => state.contents);
    const contract = useSelector(state => state.contract);
    const sessions = useSelector(state => state.sessions);

    const dispatch = useDispatch();
    const setContentsData = bindActionCreators(setContents, dispatch);
    const setSessionsData = bindActionCreators(setSessions, dispatch);

    const fetchData = async () => {
        if(!contract.signer) return setError(true);

        setError(false);
        setLoading(true);
        // if we have loaded contents list, use it as placeholder, while still fetching for newly created contents
        if(sessions.contents) setLoading(false);
        
        // still fetch in case a new content has been created
        try {
            const contractInstance = await createContentContractInstance(contract.signer);
            const userContractInstance = await createUserContractInstance(contract.signer);
            // const p = await contractInstance.getContentList(0);
            const res = (Array.from(await contractInstance.getContentList(0))).reverse();
            const data = [];
            for(let val of res) {
                if(!inProductionContent(val)) continue;
                const value = parseContentData(val);
                const author = await userContractInstance.getUsername(value.author);
                data.push({ ...value, author, author_id: value.author });
            }
            setContentsData(data);
            if(!sessions.contents) setSessionsData({ contents: true });
            setLoading(false); 
        } catch (err) {
            setError(true);
            setLoading(false); 
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    return (
        <main>
            {!error && <div className='post'>
                <h2>Top Posts</h2>
                <button className='post-button cursor' onClick={() => openModal()}>Add post</button>
            </div>}
            {
                error ? <div className='post-error'><ErrorPage text={'Error loading data'} refreshFn={fetchData} /></div> :
                loading ? <ContentLoading /> :
                
                contents.length === 0 ?
                <div className='No-list-Data'>
                    <NoData text={'No post created. Click the Create Add post button up to create one now.'} />
                </div> :

                <ul className='post-ul'>
                    {contents.map((val, idx) => (
                        <li className='post-list' key={`post-content-${idx}`}>
                            <div className='pl-top'>
                                <div className='pl-img'></div>
                                <span className='pl-txt cursor' 
                                onClick={() => navigate(`/app/profile/${val.author_id}`)}>
                                    {val.author}
                                </span>
                                <span className='post-time'>{`posted ${formatDate(val.timestamp, true)}`}</span>
                            </div>
                            <div className='pl-mid cursor' onClick={() => navigate(`/app/post/${val.content_id}`)}>
                                <div className='pl-mid-txt'>{val.sub_data.title}</div>
                                {val.sub_data.secure_url && <ContentFile data={val.sub_data} />}
                            </div>
                            <div className='pl-base'>
                                <div className='pl-groupings'>
                                    {val.sub_data?.tags && val.sub_data.tags.map((tag, tag_idx) => (
                                        <div className='pl-group' key={`plg-${tag_idx}`}>{tag}</div>
                                    ))}
                                </div>
                                {/* move number of votes to content page as we will need to fetch data for it */}
                                {/* <span className='pl-votes'>2 votes</span> */}
                            </div>
                        </li>
                    ))}
                </ul>
            }
        </main>
    );

};

export default Contentlist;