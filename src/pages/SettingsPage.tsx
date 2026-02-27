import React, { useState } from 'react';
import Navigation from '../components/Navigation';

const SettingsPage: React.FC = () => {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [publicProfile, setPublicProfile] = useState(false);

  return (
    <div className="bg-layer-bg min-h-screen font-sans">
      <Navigation />
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <h1 className="text-4xl font-bold text-layer-dark mb-8">Settings</h1>
        
        <div className="bg-white rounded-xl shadow-lg p-6 space-y-8">
          
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100">Preferences</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-700">Push Notifications</h3>
                  <p className="text-sm text-gray-500">Get alerts about style suggestions and weather.</p>
                </div>
                <button 
                  onClick={() => setNotifications(!notifications)}
                  className={`w-12 h-6 rounded-full p-1 transition-colors ${notifications ? 'bg-green-500' : 'bg-gray-300'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${notifications ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-700">Dark Mode</h3>
                  <p className="text-sm text-gray-500">Easier on the eyes at night.</p>
                </div>
                <button 
                  onClick={() => setDarkMode(!darkMode)}
                  className={`w-12 h-6 rounded-full p-1 transition-colors ${darkMode ? 'bg-layer-dark' : 'bg-gray-300'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${darkMode ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </button>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100">Privacy</h2>
             <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-700">Public Profile</h3>
                  <p className="text-sm text-gray-500">Allow others to see your public capsule wardrobes.</p>
                </div>
                <button 
                  onClick={() => setPublicProfile(!publicProfile)}
                  className={`w-12 h-6 rounded-full p-1 transition-colors ${publicProfile ? 'bg-green-500' : 'bg-gray-300'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${publicProfile ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </button>
              </div>
          </section>

          <section>
             <h2 className="text-xl font-bold text-red-600 mb-4 pb-2 border-b border-gray-100">Danger Zone</h2>
             <button className="text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 px-4 py-2 rounded font-bold transition">
               Delete Account
             </button>
          </section>

        </div>
      </div>
    </div>
  );
};

export default SettingsPage;