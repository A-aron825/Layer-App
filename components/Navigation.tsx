
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { backend } from '../services/backend';

interface NavigationProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

// Added interface for Navigation Items to include the optional 'pro' status
interface NavItem {
  id: string;
  label: string;
  pro?: boolean;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<number | null>(null);
  const navigate = useNavigate();
  const user = backend.getCurrentUser();
  const isPro = user?.plan === 'Pro' || user?.plan === 'Elite';

  const handleLogout = async () => {
    await backend.logout();
    navigate('/');
  };

  const handleNavClick = (tabName: string) => {
    if (tabName === 'neural' && !isPro) {
      navigate('/upgrade');
      return;
    }
    if (onTabChange) {
      onTabChange(tabName);
    } else {
      navigate('/dashboard');
    }
  };

  const navigateTo = (path: string) => {
    navigate(path);
    setIsProfileOpen(false);
  };

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsProfileOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = window.setTimeout(() => {
      setIsProfileOpen(false);
    }, 200);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Explicitly typed navItems to prevent property 'pro' does not exist error
  const navItems: NavItem[] = [
    { id: 'wardrobe', label: 'Wardrobe' },
    { id: 'outfits', label: 'Outfits' },
    { id: 'library', label: 'Library' },
    { id: 'explore', label: 'Explore' },
    { id: 'planner', label: 'Planner' },
  ];

  return (
    <header className="bg-layer-primary dark:bg-slate-900 text-white px-4 md:px-8 py-3 md:py-6 flex justify-between items-center shadow-2xl relative z-[400] border-b-2 border-white/10 dark:border-white/5 transition-colors duration-300">
      <div className="flex items-center gap-2 md:gap-4 cursor-pointer group" onClick={() => handleNavClick('wardrobe')}>
         <div className="w-10 h-10 md:w-14 md:h-14 bg-white dark:bg-layer-btn rounded-xl md:rounded-[1.2rem] rotate-3 flex items-center justify-center text-layer-primary dark:text-white text-xl md:text-3xl font-black shadow-xl group-hover:rotate-0 transition-all duration-300">
           <i className="fa-solid fa-layer-group"></i>
         </div>
         <span className="text-xl md:text-3xl font-black tracking-tighter hidden lg:block uppercase">LAYER</span>
      </div>

      <div className="flex-1 flex justify-center overflow-x-auto no-scrollbar mx-2 md:mx-4">
        <nav className="flex items-center gap-1 md:gap-2 bg-black/20 p-1 md:p-2 rounded-full backdrop-blur-2xl ring-1 ring-white/20">
          {navItems.map(item => {
            // Fixed: TypeScript error on line 83 by ensuring NavItem interface includes 'pro'
            const isLocked = item.pro && !isPro;
            return (
              <button 
                key={item.id}
                onClick={() => handleNavClick(item.id)} 
                className={`px-4 py-2 md:px-8 md:py-3 rounded-full transition-all text-[8px] md:text-[10px] font-black uppercase tracking-[0.1em] md:tracking-[0.2em] whitespace-nowrap flex items-center gap-1 md:gap-2 ${activeTab === item.id ? 'bg-white text-layer-primary shadow-2xl scale-105' : 'text-white/80 hover:bg-white/10 hover:text-white'} ${isLocked ? 'opacity-50 grayscale hover:opacity-100' : ''}`}
              >
                {item.label}
                {isLocked && <i className="fa-solid fa-lock text-[8px]"></i>}
              </button>
            );
          })}
        </nav>
      </div>
      
      <div 
        className="relative flex-shrink-0" 
        ref={dropdownRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <button 
          onClick={() => setIsProfileOpen(!isProfileOpen)}
          className={`w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-[1.2rem] flex items-center justify-center transition-all shadow-2xl border-2 md:border-4 ${isProfileOpen ? 'bg-white text-layer-primary border-white' : 'bg-layer-dark dark:bg-slate-800 text-white border-transparent hover:scale-105 active:scale-90'}`}
        >
           <i className="fa-solid fa-user text-lg md:text-2xl"></i>
        </button>
        
        {isProfileOpen && (
          <div className="absolute right-0 top-full mt-6 w-80 bg-layer-dark/95 dark:bg-slate-800/95 backdrop-blur-3xl rounded-[2.5rem] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.5)] overflow-hidden animate-fade-in text-left border-2 border-white/10">
            <div className="px-8 py-6 border-b border-white/10 bg-gradient-to-br from-white/5 to-transparent">
              <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1">Session Active</p>
              <p className="text-xl font-black text-white truncate">{user?.username || 'Style Icon'}</p>
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/20 shadow-inner">
                <i className={`fa-solid ${user?.plan === 'Elite' ? 'fa-crown text-yellow-400' : user?.plan === 'Pro' ? 'fa-bolt text-blue-400' : 'fa-seedling text-green-400'} text-[10px]`}></i>
                <span className="text-[10px] font-black text-white uppercase tracking-widest">
                  {user?.plan || 'Starter'} Plan
                </span>
              </div>
            </div>

            <div className="py-2">
              <button onClick={() => navigateTo('/settings')} className="block w-full text-left px-8 py-4 text-sm font-bold text-white hover:bg-white/10 transition-all flex items-center gap-4">
                <i className="fa-solid fa-gear w-6 text-white/40"></i> Account Settings
              </button>
              <button onClick={() => navigateTo('/upgrade')} className="block w-full text-left px-8 py-4 text-sm font-bold text-white hover:bg-white/10 transition-all flex items-center gap-4">
                <i className="fa-solid fa-crown w-6 text-yellow-400"></i> Upgrade Style Plan
              </button>
            </div>

            <div className="px-8 py-6 bg-black/20">
              <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mb-4">Tier Status</p>
              <div className="space-y-3">
                 <div className={`w-full flex justify-between items-center p-3 rounded-xl border transition-all ${(!user?.plan || user?.plan === 'Starter') ? 'bg-white/10 border-white/30' : 'border-transparent opacity-40'}`}>
                    <span className="text-xs font-bold text-white">Starter</span>
                 </div>
                 <div className={`w-full flex justify-between items-center p-3 rounded-xl border transition-all ${user?.plan === 'Pro' ? 'bg-blue-500/20 border-blue-400/50' : 'border-transparent opacity-40'}`}>
                    <span className="text-xs font-bold text-white">Style Pro</span>
                    {user?.plan === 'Pro' && <i className="fa-solid fa-check text-blue-400 text-[10px]"></i>}
                 </div>
                 <div className={`w-full flex justify-between items-center p-3 rounded-xl border transition-all ${user?.plan === 'Elite' ? 'bg-purple-500/20 border-purple-400/50' : 'border-transparent opacity-40'}`}>
                    <span className="text-xs font-bold text-white">Elite</span>
                    {user?.plan === 'Elite' && <i className="fa-solid fa-check text-purple-400 text-[10px]"></i>}
                 </div>
              </div>
            </div>

            <div className="border-t border-white/10 py-2 bg-red-500/10">
              <button onClick={handleLogout} className="block w-full text-left px-8 py-4 text-sm font-black text-red-200 hover:bg-red-500 hover:text-white transition-all flex items-center gap-4">
                <i className="fa-solid fa-power-off w-6"></i> Terminate Session
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navigation;
