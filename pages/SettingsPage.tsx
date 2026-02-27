
import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';

const SettingsPage: React.FC = () => {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });
  const [publicProfile, setPublicProfile] = useState(false);

  const toggleDarkMode = () => {
    const isDark = !darkMode;
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('layer_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('layer_theme', 'light');
    }
  };

  return (
    <div className="bg-layer-bg dark:bg-slate-900 min-h-screen font-sans transition-colors duration-300">
      <Navigation />
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <h1 className="text-4xl font-black text-layer-dark dark:text-layer-primary mb-8 tracking-tighter uppercase">Settings</h1>
        
        <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl p-10 space-y-12 border border-gray-100 dark:border-slate-700 transition-all">
          
          <section>
            <h2 className="text-xl font-black text-gray-900 dark:text-white mb-6 pb-2 border-b border-gray-100 dark:border-slate-700 uppercase tracking-widest">Preferences</h2>
            <div className="space-y-8">
              <div className="flex items-center justify-between group">
                <div>
                  <h3 className="font-black text-gray-700 dark:text-gray-200 uppercase text-xs tracking-widest">Push Notifications</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Get alerts about style suggestions and weather.</p>
                </div>
                <button 
                  onClick={() => setNotifications(!notifications)}
                  className={`w-16 h-8 rounded-full p-1 transition-all duration-300 ${notifications ? 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.4)]' : 'bg-gray-300 dark:bg-slate-700'}`}
                >
                  <div className={`w-6 h-6 bg-white rounded-full shadow-lg transform transition-transform duration-300 ${notifications ? 'translate-x-8' : 'translate-x-0'}`}></div>
                </button>
              </div>

              <div className="flex items-center justify-between group">
                <div>
                  <h3 className="font-black text-gray-700 dark:text-gray-200 uppercase text-xs tracking-widest">Dark Mode</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Easier on the eyes at night.</p>
                </div>
                <button 
                  onClick={toggleDarkMode}
                  className={`w-16 h-8 rounded-full p-1 transition-all duration-300 ${darkMode ? 'bg-layer-dark shadow-[0_0_15px_rgba(0,95,158,0.4)]' : 'bg-gray-300 dark:bg-slate-700'}`}
                >
                  <div className={`w-6 h-6 bg-white rounded-full shadow-lg transform transition-transform duration-300 ${darkMode ? 'translate-x-8' : 'translate-x-0'}`}></div>
                </button>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-black text-gray-900 dark:text-white mb-6 pb-2 border-b border-gray-100 dark:border-slate-700 uppercase tracking-widest">Privacy</h2>
             <div className="flex items-center justify-between group">
                <div>
                  <h3 className="font-black text-gray-700 dark:text-gray-200 uppercase text-xs tracking-widest">Public Profile</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Allow others to see your public collections.</p>
                </div>
                <button 
                  onClick={() => setPublicProfile(!publicProfile)}
                  className={`w-16 h-8 rounded-full p-1 transition-all duration-300 ${publicProfile ? 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.4)]' : 'bg-gray-300 dark:bg-slate-700'}`}
                >
                  <div className={`w-6 h-6 bg-white rounded-full shadow-lg transform transition-transform duration-300 ${publicProfile ? 'translate-x-8' : 'translate-x-0'}`}></div>
                </button>
              </div>
          </section>

          <section>
             <h2 className="text-xl font-black text-red-600 mb-6 pb-2 border-b border-red-50 dark:border-red-950/20 uppercase tracking-widest">Danger Zone</h2>
             <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 font-medium">Once you terminate your account, all closet data and neural weights are permanently deleted.</p>
             <button className="w-full text-red-600 dark:text-red-400 border-2 border-red-100 dark:border-red-900/30 bg-red-50 dark:bg-red-950/10 hover:bg-red-500 hover:text-white dark:hover:bg-red-600 dark:hover:text-white px-8 py-4 rounded-2xl font-black transition-all uppercase text-xs tracking-[0.2em] shadow-lg active:scale-95">
               Terminate Account
             </button>
          </section>

        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
