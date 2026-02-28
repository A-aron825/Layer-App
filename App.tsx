
import React, { useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import Dashboard from './pages/Dashboard';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import UpgradePage from './pages/UpgradePage';
import PrivacyPage from './pages/PrivacyPage';
import ProtocolPage from './pages/ProtocolPage';

const App: React.FC = () => {
  useEffect(() => {
    // Check local storage for theme preference
    const savedTheme = localStorage.getItem('layer_theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/upgrade" element={<UpgradePage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/protocol" element={<ProtocolPage />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
