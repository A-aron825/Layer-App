
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { backend } from '../services/backend';

const LandingPage: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const user = backend.getCurrentUser();
    if (user) navigate('/dashboard');
  }, [navigate]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="bg-layer-bg min-h-screen font-sans">
      
      {/* Sticky Header */}
      <nav className={`fixed top-0 left-0 right-0 z-[500] transition-all duration-300 ${scrolled ? 'bg-layer-dark/95 backdrop-blur-md shadow-lg py-3 md:py-4' : 'bg-transparent py-4 md:py-8'}`}>
        <div className="container mx-auto px-4 md:px-8 flex justify-between items-center">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-8 h-8 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-lg md:text-2xl font-black bg-white text-layer-primary shadow-xl rotate-3">
              <i className="fa-solid fa-layer-group"></i>
            </div>
            <span className="text-xl md:text-3xl font-black tracking-tighter text-white">LAYER</span>
          </div>
          <div className="flex gap-2 md:gap-6">
            <Link to="/login" className="px-4 py-2 md:px-8 md:py-3 rounded-xl md:rounded-2xl font-black text-white hover:bg-white/10 transition text-xs md:text-sm uppercase tracking-widest">
              Login
            </Link>
            <Link to="/signup" className="px-4 py-2 md:px-8 md:py-3 rounded-xl md:rounded-2xl font-black bg-white text-layer-dark shadow-2xl hover:scale-105 transition transform text-xs md:text-sm uppercase tracking-widest">
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      {/* High-Energy Geometric Banner */}
      <div 
        className="w-full text-center py-32 md:py-64 relative overflow-hidden"
        style={{ 
          backgroundColor: '#0077be',
          backgroundImage: `
            linear-gradient(30deg, #005f9e 12%, transparent 12.5%, transparent 87%, #005f9e 87.5%, #005f9e),
            linear-gradient(150deg, #005f9e 12%, transparent 12.5%, transparent 87%, #005f9e 87.5%, #005f9e),
            linear-gradient(30deg, #005f9e 12%, transparent 12.5%, transparent 87%, #005f9e 87.5%, #005f9e),
            linear-gradient(150deg, #005f9e 12%, transparent 12.5%, transparent 87%, #005f9e 87.5%, #005f9e),
            linear-gradient(60deg, #0089cc 25%, transparent 25.5%, transparent 75%, #0089cc 75%, #0089cc),
            linear-gradient(60deg, #0089cc 25%, transparent 25.5%, transparent 75%, #0089cc 75%, #0089cc)
          `,
          backgroundSize: '80px 140px',
          backgroundPosition: '0 0, 0 0, 40px 70px, 40px 70px, 0 0, 40px 70px'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-layer-bg"></div>
        <div className="relative z-10 text-white px-4">
          <h1 className="text-5xl md:text-[10rem] font-black mb-4 md:mb-8 drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-fade-in-up leading-none tracking-tighter">Layer</h1>
          <p className="text-lg md:text-4xl font-black mb-8 md:mb-16 drop-shadow-xl max-w-4xl mx-auto uppercase tracking-[0.1em] md:tracking-[0.2em] opacity-80">Autonomous Style Intelligence</p>
          <div className="flex justify-center gap-4 md:gap-8 flex-wrap">
            <Link to="/signup" className="bg-white text-layer-btn px-8 py-3 md:px-16 md:py-6 rounded-xl md:rounded-[2rem] text-xl md:text-3xl font-black hover:bg-gray-100 hover:scale-110 transition-all shadow-xl ring-4 md:ring-8 ring-white/10 uppercase tracking-tighter">
              Ignite Capsule
            </Link>
          </div>
        </div>
      </div>

      {/* Style Section */}
      <div className="bg-white py-16 md:py-32 px-4 md:px-8 text-center relative z-20">
        <h3 className="text-3xl md:text-7xl text-layer-btn font-black mb-12 md:mb-24 tracking-tighter">ELIMINATE INDECISION</h3>
        <div className="max-w-5xl mx-auto space-y-8 md:space-y-16">
          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-12 text-left bg-gray-50 p-6 md:p-12 rounded-2xl md:rounded-[3rem] border-l-[8px] md:border-l-[16px] border-layer-btn">
             <i className="fa-solid fa-wand-magic-sparkles text-4xl md:text-7xl text-layer-btn"></i>
             <div>
               <p className="text-xl md:text-3xl font-black text-layer-dark mb-2 md:mb-4 tracking-tight">"I have nothing to wear."</p>
               <p className="text-base md:text-xl text-gray-500 font-bold italic leading-relaxed">Layer's neural engine identifies high-value combinations from your existing items instantly.</p>
             </div>
          </div>
          <div className="flex flex-col md:flex-row-reverse items-center gap-6 md:gap-12 text-left bg-gray-50 p-6 md:p-12 rounded-2xl md:rounded-[3rem] border-r-[8px] md:border-r-[16px] border-layer-primary">
             <i className="fa-solid fa-bolt-lightning text-4xl md:text-7xl text-layer-primary"></i>
             <div>
               <p className="text-xl md:text-3xl font-black text-layer-dark mb-2 md:mb-4 tracking-tight">"I waste too much time."</p>
               <p className="text-base md:text-xl text-gray-500 font-bold italic leading-relaxed">Automated weekly planning and weather-aware suggestions ensure you are ready in seconds.</p>
             </div>
          </div>
        </div>
      </div>

      <footer className="bg-layer-dark text-white py-32 text-center">
        <div className="flex flex-col md:flex-row justify-center gap-12 mb-12">
          <Link to="/privacy" className="text-xl font-black hover:text-layer-primary transition uppercase tracking-widest">Vault Privacy</Link>
          <Link to="/protocol" className="text-xl font-black hover:text-layer-primary transition uppercase tracking-widest">Style Protocol</Link>
        </div>
        <p className="text-white/40 font-bold">© 2025 LAYER NEURAL STYLIST. ALL RIGHTS RESERVED.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
