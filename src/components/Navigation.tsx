import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { backend } from '../services/backend';

interface NavigationProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const user = backend.getCurrentUser();

  const handleLogout = async () => {
    await backend.logout();
    navigate('/');
  };

  const handleNavClick = (tabName: string) => {
    if (onTabChange) {
      onTabChange(tabName);
    } else {
      navigate('/dashboard');
    }
  };

  const navigateTo = (path: string) => {
    navigate(path);
    setIsProfileOpen(false);
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { id: 'wardrobe', label: 'Wardrobe' },
    { id: 'outfits', label: 'Outfits' },
    { id: 'planner', label: 'Planner' },
    { id: 'travel', label: 'Travel' },
  ];

  return (
    <header className="bg-layer-primary text-white px-4 py-3 flex justify-between items-center shadow-lg relative z-50">
      
      {/* Logo Area */}
      <div className="flex items-center gap-3 cursor-pointer hover:opacity-90 transition" onClick={() => handleNavClick('wardrobe')}>
         <div className="w-10 h-10 bg-white rounded-xl rotate-3 flex items-center justify-center text-layer-primary text-xl font-bold shadow-sm">
           <i className="fa-solid fa-layer-group"></i>
         </div>
         <span className="text-xl font-bold tracking-wider hidden sm:block">LAYER</span>
      </div>

      {/* Center Nav Links (Scrollable) */}
      <div className="flex-1 mx-4 overflow-hidden">
        <nav className="flex items-center justify-center gap-1 md:gap-2 overflow-x-auto no-scrollbar">
          {navItems.map(item => (
            <button 
              key={item.id}
              onClick={() => handleNavClick(item.id)} 
              className={`px-4 py-2 rounded-full transition text-sm md:text-base whitespace-nowrap ${activeTab === item.id ? 'bg-white text-layer-primary font-bold shadow-md' : 'text-white/90 hover:bg-white/10 hover:text-white'}`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>
      
      {/* Profile Section (Fixed/Absolute context safe) */}
      <div className="relative flex-shrink-0" ref={dropdownRef}>
        <button 
          onClick={() => setIsProfileOpen(!isProfileOpen)}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-md border-2 ${isProfileOpen ? 'bg-white text-layer-primary border-white' : 'bg-layer-dark text-white border-transparent hover:border-white/50'}`}
        >
           <i className="fa-solid fa-user"></i>
        </button>
        
        {isProfileOpen && (
          <div className="absolute right-0 top-full mt-3 w-56 bg-layer-dark/95 backdrop-blur-md rounded-xl shadow-2xl overflow-hidden animate-fade-in text-left z-50 border border-white/20 ring-1 ring-black/5">
            <div className="px-4 py-3 border-b border-white/10">
              <p className="text-sm text-white/70">Signed in as</p>
              <p className="text-sm font-bold text-white truncate">{user?.email || 'Guest'}</p>
            </div>
            <div className="py-1">
              <button onClick={() => navigateTo('/settings')} className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10 transition flex items-center gap-3">
                <i className="fa-solid fa-gear w-4"></i> Settings
              </button>
              <button onClick={() => navigateTo('/profile')} className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10 transition flex items-center gap-3">
                <i className="fa-solid fa-user-circle w-4"></i> Profile
              </button>
              <button onClick={() => navigateTo('/upgrade')} className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10 transition flex items-center gap-3">
                <i className="fa-solid fa-crown w-4 text-yellow-400"></i> Upgrade Plan
              </button>
            </div>
            <div className="border-t border-white/10 py-1">
              <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm text-red-200 hover:bg-red-500/20 transition flex items-center gap-3">
                <i className="fa-solid fa-right-from-bracket w-4"></i> Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navigation;