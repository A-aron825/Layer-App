import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { backend } from '../services/backend';

const UpgradePage: React.FC = () => {
  const navigate = useNavigate();

  const handleUpgrade = async (plan: 'Starter' | 'Pro' | 'Elite') => {
    try {
      await backend.updatePlan(plan);
      alert(`Success! You have been upgraded to the ${plan} tier.`);
      navigate('/dashboard');
    } catch (e) {
      alert("Failed to process upgrade. Please try again.");
    }
  };

  return (
    <div className="bg-layer-bg dark:bg-slate-900 min-h-screen font-sans transition-colors duration-300">
      <Navigation />
      <div className="container mx-auto px-4 py-24 text-center">
        <h1 className="text-5xl md:text-7xl font-black text-layer-dark dark:text-layer-primary mb-6 tracking-tighter drop-shadow-sm uppercase">
          Select Your Tier
        </h1>
        <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-300 mb-20 max-w-2xl mx-auto font-bold opacity-80 uppercase tracking-widest leading-relaxed">
          The future of personal style is intelligent. Choose the tier that matches your ambition.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-6xl mx-auto items-stretch">
          
          {/* Basic Plan */}
          <div className="bg-white dark:bg-slate-800 rounded-[3rem] p-12 shadow-xl border border-gray-100 dark:border-slate-700 flex flex-col hover:scale-105 transition duration-300 ring-1 ring-black/5">
             <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-2 uppercase tracking-tighter">Starter</h3>
             <div className="text-5xl font-black text-layer-primary mb-10 tracking-tighter">
                $0<span className="text-lg font-bold text-gray-400 dark:text-gray-500">/mo</span>
             </div>
             <ul className="text-left space-y-5 mb-12 flex-1">
               <li className="flex items-center gap-3 text-gray-600 dark:text-gray-300 font-bold"><i className="fa-solid fa-check text-green-500 bg-green-50 dark:bg-green-950/20 p-2 rounded-full text-xs"></i> 40 Vault Slots</li>
               <li className="flex items-center gap-3 text-gray-600 dark:text-gray-300 font-bold"><i className="fa-solid fa-check text-green-500 bg-green-50 dark:bg-green-950/20 p-2 rounded-full text-xs"></i> Daily AI Generator</li>
               <li className="flex items-center gap-3 text-gray-600 dark:text-gray-300 font-bold"><i className="fa-solid fa-check text-green-500 bg-green-50 dark:bg-green-950/20 p-2 rounded-full text-xs"></i> 1 Capsule Collection</li>
               <li className="flex items-center gap-3 text-gray-400 dark:text-gray-600 font-bold opacity-40 line-through"><i className="fa-solid fa-times bg-gray-50 dark:bg-slate-900 p-2 rounded-full text-xs"></i> Pro Stylist Lab</li>
             </ul>
             <button 
               onClick={() => handleUpgrade('Starter')}
               className="w-full py-5 rounded-2xl border-4 border-gray-100 dark:border-slate-700 font-black text-gray-400 dark:text-gray-500 text-sm uppercase tracking-widest hover:bg-gray-50 transition"
             >
               Starter Active
             </button>
          </div>

          {/* Pro Plan */}
          <div className="bg-white dark:bg-slate-800 rounded-[3rem] p-12 shadow-2xl border-4 border-layer-btn flex flex-col relative transform scale-105 z-10 transition hover:scale-[1.08]">
             <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-layer-btn text-white px-8 py-3 rounded-full text-xs font-black uppercase tracking-[0.2em] shadow-2xl">High Efficiency</div>
             <h3 className="text-3xl font-black text-layer-dark dark:text-layer-primary mb-2 uppercase tracking-tighter">Style Pro</h3>
             <div className="text-5xl font-black text-layer-dark dark:text-white mb-10 tracking-tighter">
                $2.99<span className="text-lg font-bold text-gray-400 dark:text-gray-500">/mo</span>
             </div>
             <ul className="text-left space-y-5 mb-12 flex-1">
               <li className="flex items-center gap-3 text-gray-700 dark:text-gray-200 font-black"><i className="fa-solid fa-comment-dots text-blue-500 bg-blue-50 dark:bg-blue-950/20 p-2 rounded-full text-xs"></i> 24/7 AI Chatbot Stylist</li>
               <li className="flex items-center gap-3 text-gray-700 dark:text-gray-200 font-black"><i className="fa-solid fa-star text-blue-500 bg-blue-50 dark:bg-blue-950/20 p-2 rounded-full text-xs"></i> Orbit: Build-Around-Piece</li>
               <li className="flex items-center gap-3 text-gray-700 dark:text-gray-200 font-black"><i className="fa-solid fa-magnifying-glass-chart text-blue-500 bg-blue-50 dark:bg-blue-950/20 p-2 rounded-full text-xs"></i> Style Gap Analysis</li>
               <li className="flex items-center gap-3 text-gray-700 dark:text-gray-200 font-black"><i className="fa-solid fa-calendar-check text-blue-500 bg-blue-50 dark:bg-blue-950/20 p-2 rounded-full text-xs"></i> Weekly Auto-Scheduler</li>
               <li className="flex items-center gap-3 text-gray-700 dark:text-gray-200 font-black"><i className="fa-solid fa-hammer text-blue-500 bg-blue-50 dark:bg-blue-950/20 p-2 rounded-full text-xs"></i> Manual Ensemble Builder</li>
             </ul>
             <button 
               onClick={() => handleUpgrade('Pro')}
               className="w-full py-6 rounded-2xl bg-layer-btn text-white font-black text-lg shadow-2xl hover:bg-layer-dark transition-all transform hover:-translate-y-1 active:scale-95 uppercase tracking-widest"
             >
               Go Pro
             </button>
          </div>

          {/* Elite Plan */}
          <div className="bg-slate-900 rounded-[3rem] p-12 shadow-[0_0_50px_rgba(168,85,247,0.3)] border-4 border-purple-600 flex flex-col relative transform scale-105 z-10 transition hover:scale-[1.08] animate-pulse-border">
             <style>{`
                @keyframes pulse-border {
                  0% { border-color: rgba(147, 51, 234, 1); box-shadow: 0 0 20px rgba(147, 51, 234, 0.3); }
                  50% { border-color: rgba(192, 132, 252, 1); box-shadow: 0 0 50px rgba(192, 132, 252, 0.5); }
                  100% { border-color: rgba(147, 51, 234, 1); box-shadow: 0 0 20px rgba(147, 51, 234, 0.3); }
                }
                .animate-pulse-border {
                  animation: pulse-border 3s infinite ease-in-out;
                }
             `}</style>
             <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-purple-600 text-white px-8 py-3 rounded-full text-xs font-black uppercase tracking-[0.2em] shadow-2xl">The Ultimate</div>
             <h3 className="text-3xl font-black text-purple-400 mb-2 uppercase tracking-tighter">Elite</h3>
             <div className="text-5xl font-black text-white mb-10 tracking-tighter">
                $9.99<span className="text-lg font-bold text-slate-500">/mo</span>
             </div>
             <ul className="text-left space-y-5 mb-12 flex-1">
               <li className="flex items-center gap-3 text-slate-300 font-black"><i className="fa-solid fa-fingerprint text-purple-400 bg-purple-900/50 p-2 rounded-full text-xs"></i> Master Stylist Persona</li>
               <li className="flex items-center gap-3 text-slate-300 font-black"><i className="fa-solid fa-user-astronaut text-purple-400 bg-purple-900/50 p-2 rounded-full text-xs"></i> Style Twin Icon Match</li>
               <li className="flex items-center gap-3 text-slate-300 font-black"><i className="fa-solid fa-atom text-purple-400 bg-purple-900/50 p-2 rounded-full text-xs"></i> Fabric Synergy Insights</li>
               <li className="flex items-center gap-3 text-slate-300 font-black"><i className="fa-solid fa-headset text-purple-400 bg-purple-900/50 p-2 rounded-full text-xs"></i> Elite Style Audit</li>
               <li className="flex items-center gap-3 text-slate-300 font-black"><i className="fa-solid fa-dna text-purple-400 bg-purple-900/50 p-2 rounded-full text-xs"></i> Aesthetic DNA Matching</li>
             </ul>
             <button 
               onClick={() => handleUpgrade('Elite')}
               className="w-full py-6 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-black text-lg shadow-2xl hover:brightness-110 transition-all transform hover:-translate-y-1 active:scale-95 uppercase tracking-widest"
             >
               Unlock Elite
             </button>
          </div>

        </div>

        <div className="mt-24 max-w-2xl mx-auto">
          <p className="text-gray-400 dark:text-gray-600 font-bold uppercase tracking-[0.3em] text-xs">Secure Vault Checkout • Cancel Anytime • 24/7 Style Support</p>
        </div>
      </div>
    </div>
  );
};

export default UpgradePage;