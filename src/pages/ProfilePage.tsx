import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import { backend } from '../services/backend';

const ProfilePage: React.FC = () => {
  const user = backend.getCurrentUser();
  const [stats, setStats] = useState({ items: 0, outfits: 0 });

  useEffect(() => {
    const loadStats = async () => {
       const items = await backend.getItems();
       const outfits = await backend.getOutfits();
       setStats({ items: items.length, outfits: outfits.length });
    };
    loadStats();
  }, []);

  if (!user) return <div>Please login</div>;

  return (
    <div className="bg-layer-bg min-h-screen font-sans">
      <Navigation />
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-4xl font-bold text-layer-dark mb-8">My Profile</h1>
        
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-layer-primary h-32 relative">
             <div className="absolute -bottom-12 left-8">
               <div className="w-24 h-24 bg-white rounded-full p-1 shadow-lg">
                 <div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center text-4xl text-gray-400">
                   <i className="fa-solid fa-user"></i>
                 </div>
               </div>
             </div>
          </div>
          
          <div className="pt-16 px-8 pb-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">{user.username}</h2>
                <p className="text-gray-500">{user.email}</p>
                <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mt-2 font-bold uppercase">Basic Member</span>
              </div>
              <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-bold transition">
                Edit Profile
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-gray-100 pt-6">
               <div>
                  <h3 className="font-bold text-gray-400 text-sm uppercase mb-3">Style Preferences</h3>
                  <div className="flex flex-wrap gap-2">
                    {user.styles && user.styles.length > 0 ? user.styles.map(tag => (
                      <span key={tag} className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm">{tag}</span>
                    )) : (
                      <span className="text-sm text-gray-400">No styles selected yet.</span>
                    )}
                  </div>
               </div>
               <div>
                  <h3 className="font-bold text-gray-400 text-sm uppercase mb-3">Sizes</h3>
                   <ul className="space-y-2 text-sm text-gray-600">
                     <li className="flex justify-between"><span>Tops</span> <span className="font-bold">M</span></li>
                     <li className="flex justify-between"><span>Bottoms</span> <span className="font-bold">32</span></li>
                     <li className="flex justify-between"><span>Shoes</span> <span className="font-bold">10.5</span></li>
                   </ul>
               </div>
            </div>
            
             <div className="mt-8 border-t border-gray-100 pt-6">
                  <h3 className="font-bold text-gray-400 text-sm uppercase mb-3">Stats</h3>
                  <div className="flex gap-8">
                     <div className="text-center">
                       <span className="block text-2xl font-bold text-layer-btn">{stats.items}</span>
                       <span className="text-xs text-gray-500">Items</span>
                     </div>
                     <div className="text-center">
                       <span className="block text-2xl font-bold text-layer-btn">{stats.outfits}</span>
                       <span className="text-xs text-gray-500">Outfits</span>
                     </div>
                     <div className="text-center">
                       <span className="block text-2xl font-bold text-layer-btn">0</span>
                       <span className="text-xs text-gray-500">Donated</span>
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