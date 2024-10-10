import { Route, Routes } from 'react-router-dom';
import './App.css';
import VotingApp from './Voting';
import Signup from './pages/signup';
import LandingPage from './pages/landingPage';
import { useSelector } from 'react-redux';
import Alert from './component/Alert';

function App() {
  const alertMessage = useSelector(state => state.message);

  return (
    <div className="App">
      {alertMessage.message && <Alert data={alertMessage} />}

      <Routes>
          <Route path='/' element={<LandingPage />} />
          <Route path='/signup' element={<Signup />} />
          <Route path='/app/*' element={<VotingApp />} />
      </Routes>
    </div>
  );
}

export default App;
