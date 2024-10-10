import { useState } from 'react';
import { MdArrowBack, MdEdit } from 'react-icons/md';
import MultiChoiceInputWithDropdown from '../../component/multiChoice';
import '../signup/styles.css';
import { useNavigate } from 'react-router-dom';

const EditUser = () => {
    const lists = Array(5).fill('Ethereum');
    const [user, setUser] = useState({ interests: [] });
    const navigate = useNavigate();

    function selectFn(values) {
        setUser({ ...user, interests: values });
    };

    function handleChange(e) {
        return;
    };

    return (
        <div className='edit'>
            <div className='edit-user'>
                <main>
                    <div className='eu signup-content'>
                        <div className='eu-header'>
                            <MdArrowBack className='eu-header-icon cursor' onClick={() => navigate(-1)} />
                            <h3>Edit profile</h3>
                        </div>
                        <form className='signup-form'>
                            <div className='sf-filed edit-picture'>
                                <label>Profile picture</label>
                                <div className='picture-edit'>
                                    <div className='pe-img'>
                                        <div className='pe-img-edit cursor'>
                                            <MdEdit className='pe-img-edit-icon' />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className='sf-filed'>
                                <label>Username</label>
                                <input placeholder='Enter username' onChange={handleChange} />
                            </div>
                            <div className='sf-filed'>
                                <label>E-mail</label>
                                <input placeholder='Enter email' type='email' onChange={handleChange} />
                            </div>
                            <div className='sf-filed'>
                                <label>Password</label>
                                <input placeholder='Enter password' type='password' onChange={handleChange} />
                            </div>
                            <div className='sf-filed'>
                                <label>Interests</label>
                                <div className='sf-drp'>
                                    <MultiChoiceInputWithDropdown class_name={'sf-filed-input'} placeholder={'Select some interests'}
                                    dropdownLists={lists} selected={user.interests} selectFn={selectFn} />
                                </div>
                            </div>
                            <div className='sf-submit'>
                                <input type='submit' value='Edit' className='cursor' />
                            </div>
                        </form>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default EditUser;