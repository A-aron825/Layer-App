
import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import Dashboard from './pages/Dashboard';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import UpgradePage from './pages/UpgradePage';
import PrivacyPage from './pages/PrivacyPage';
import ProtocolPage from './pages/ProtocolPage';
import { supabase } from './services/supabase';

const App: React.FC = () => {
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    // Check local storage for theme preference
    const savedTheme = localStorage.getItem('layer_theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Initial session check
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Fetch profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        const user = {
          id: session.user.id,
          email: session.user.email!,
          username: profile?.username || session.user.user_metadata.full_name || session.user.email?.split('@')[0],
          styles: profile?.styles || [],
          plan: profile?.plan || 'Starter'
        };
        localStorage.setItem('layer_current_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('layer_current_user');
      }
      setIsAuthReady(true);
    };

    checkSession();

    // Sync Supabase session with backend local storage
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        // Check if profile exists
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (!profile && event === 'SIGNED_IN') {
          // Create profile if missing (common for first-time social login)
          await supabase.from('profiles').insert({
            id: session.user.id,
            email: session.user.email,
            username: session.user.user_metadata.full_name || session.user.email?.split('@')[0],
            styles: [],
            plan: 'Starter'
          });
        }

        const user = {
          id: session.user.id,
          email: session.user.email!,
          username: profile?.username || session.user.user_metadata.full_name || session.user.email?.split('@')[0],
          styles: profile?.styles || [],
          plan: profile?.plan || 'Starter'
        };
        localStorage.setItem('layer_current_user', JSON.stringify(user));
      } else {
        // If no session, clear local storage to ensure backend knows we are logged out
        localStorage.removeItem('layer_current_user');
      }
      setIsAuthReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-layer-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route index element={<LandingPage />} />
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/upgrade" element={<UpgradePage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/protocol" element={<ProtocolPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
