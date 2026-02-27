
import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import { backend } from '../services/backend';
import { User } from '../types';

const ProfilePage: React.FC = () => {
  const [user, setUser] = useState<User | null>(backend.getCurrentUser());
  const [stats, setStats] = useState({ items: 0, outfits: 0 });

  useEffect(() => {
    const loadStats = async () => {
       const items = await backend.getItems();
       const outfits = await backend.getOutfits();
       setStats({ items: items.length, outfits: outfits.length });
    };
    loadStats();
  }, []);

  const handleTogglePlan = async (newPlan: 'Starter' | 'Pro' | 'Elite') => {
    const updated = await backend.updatePlan(newPlan);
    setUser(updated);
    window.location.reload(); // Refresh to update context across app
  };

  if (!user) return <div className="p-20 text-center font-black uppercase tracking-widest text-layer-dark">Unauthorized Access</div>;

  return (
    <div className="bg-layer-bg dark:bg-slate-900 min-h-screen font-sans transition-colors duration-300">
      <Navigation />
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-5xl font-black text-layer-dark dark:text-layer-primary mb-12 tracking-tighter uppercase">My Profile</h1>
        
        <div className="bg-white dark:bg-slate-800 rounded-[3rem] shadow-2xl overflow-hidden border border-gray-100 dark:border-slate-700">
          <div className="bg-gradient-to-r from-layer-dark to-layer-primary h-48 relative">
             <div className="absolute -bottom-16 left-12">
               <div className="w-32 h-32 bg-white dark:bg-slate-700 rounded-[2.5rem] p-1 shadow-2xl rotate-3">
                 <div className="w-full h-full bg-gray-100 dark:bg-slate-600 rounded-[2rem] flex items-center justify-center text-5xl text-gray-400 dark:text-slate-400">
                   <i className="fa-solid fa-user-astronaut"></i>
                 </div>
               </div>
             </div>
             <div className="absolute top-6 right-12 flex gap-4">
                <div className="bg-white/20 backdrop-blur-md px-6 py-2 rounded-full border border-white/30 text-white font-black text-xs uppercase tracking-widest">
                  {user.plan || 'Starter'} Tier
                </div>
             </div>
          </div>
          
          <div className="pt-24 px-12 pb-12">
            <div className="flex flex-col md:flex-row justify-between items-start mb-12 gap-8">
              <div>
                <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-2">{user.username}</h2>
                <p className="text-gray-500 font-bold text-lg mb-6">{user.email}</p>
                <div className="flex flex-wrap gap-3">
                   {['Minimalist', 'Avant-Garde', 'Streetwear'].map(tag => (
                     <span key={tag} className="bg-layer-primary/10 text-layer-btn dark:text-layer-primary px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-layer-primary/20">{tag}</span>
                   ))}
                </div>
              </div>
              <button className="bg-gray-900 text-white px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 transition-all shadow-xl">
                Edit Persona
              </button>
            </div>
            
            {/* Plan Switcher for Testing */}
            <div className="bg-indigo-50 dark:bg-indigo-950/30 p-8 rounded-[2rem] mb-12 border-2 border-indigo-100 dark:border-indigo-900/50">
               <h3 className="text-indigo-800 dark:text-indigo-300 font-black uppercase text-xs tracking-[0.3em] mb-6 flex items-center gap-2">
                 <i className="fa-solid fa-flask"></i> Pro Mode Testing
               </h3>
               <div className="grid grid-cols-3 gap-4">
                  <button 
                    onClick={() => handleTogglePlan('Starter')} 
                    className={`py-4 rounded-xl font-black text-[10px] uppercase tracking-widest border-2 transition-all ${user.plan === 'Starter' ? 'bg-white text-indigo-600 border-indigo-400 shadow-lg' : 'bg-transparent text-indigo-400 border-transparent hover:bg-indigo-100'}`}
                  >
                    Starter
                  </button>
                  <button 
                    onClick={() => handleTogglePlan('Pro')} 
                    className={`py-4 rounded-xl font-black text-[10px] uppercase tracking-widest border-2 transition-all ${user.plan === 'Pro' ? 'bg-indigo-600 text-white border-indigo-700 shadow-lg scale-105' : 'bg-transparent text-indigo-400 border-transparent hover:bg-indigo-100'}`}
                  >
                    Style Pro
                  </button>
                  <button 
                    onClick={() => handleTogglePlan('Elite')} 
                    className={`py-4 rounded-xl font-black text-[10px] uppercase tracking-widest border-2 transition-all ${user.plan === 'Elite' ? 'bg-purple-600 text-white border-purple-700 shadow-lg scale-105' : 'bg-transparent text-indigo-400 border-transparent hover:bg-indigo-100'}`}
                  >
                    Elite
                  </button>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 border-t dark:border-slate-700 pt-10">
               <div>
                  <h3 className="font-black text-gray-400 text-[10px] uppercase tracking-[0.4em] mb-8">Performance Indices</h3>
                  <div className="space-y-6">
                    <div>
                       <div className="flex justify-between text-xs font-black uppercase mb-2">
                          <span className="text-gray-500">Utilization Rate</span>
                          <span className="text-layer-btn">84%</span>
                       </div>
                       <div className="h-3 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full bg-layer-btn" style={{ width: '84%' }}></div>
                       </div>
                    </div>
                    <div>
                       <div className="flex justify-between text-xs font-black uppercase mb-2">
                          <span className="text-gray-500">Sustainability Index</span>
                          <span className="text-green-500">A+</span>
                       </div>
                       <div className="h-3 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500" style={{ width: '92%' }}></div>
                       </div>
                    </div>
                  </div>
               </div>
               <div>
                  <h3 className="font-black text-gray-400 text-[10px] uppercase tracking-[0.4em] mb-8">Asset Breakdown</h3>
                  <div className="flex gap-8 text-center">
                     <div className="flex-1 bg-gray-50 dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm">
                       <span className="block text-4xl font-black text-gray-900 dark:text-white">{stats.items}</span>
                       <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Garments</span>
                     </div>
                     <div className="flex-1 bg-gray-50 dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm">
                       <span className="block text-4xl font-black text-layer-btn">{stats.outfits}</span>
                       <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ensembles</span>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
