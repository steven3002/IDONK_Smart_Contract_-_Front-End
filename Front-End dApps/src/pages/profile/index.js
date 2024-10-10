import '../signup/styles.css';
import './profile.css';
import { GiHamburgerMenu } from 'react-icons/gi';
import { Route, Routes } from 'react-router-dom';
// import ProfileHome from './profile';
import EditUser from './editUser';
import ProfileHomePage from './home';

const Profile = ({ toggleSidebar }) => {
    
    return (
        <div className='profile'>
            <div className="Profile-content">
                <div className="profile-header">
                    <GiHamburgerMenu className='profile-hamburger cursor' onClick={()=>toggleSidebar()} />
                    <h2>Profile</h2>
                </div>
                <Routes>
                    {/* <Route path='/' element={<ProfileHome />} /> */}
                    <Route path='/:id' element={<ProfileHomePage />} />
                    <Route path='/edit' element={<EditUser />} />
                </Routes>
            </div>
        </div>
    );
};

export default Profile;