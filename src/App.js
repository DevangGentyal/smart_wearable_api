import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import VerificationPage from './components/VerficationPage';
import OAuthCallback from './components/OAuthCallback';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<VerificationPage />} />
        <Route path="/oauth-callback" element={<OAuthCallback />} />
      </Routes>
    </Router>
  );
}

export default App;