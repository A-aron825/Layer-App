import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const LandingPage: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);

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
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-layer-dark/90 backdrop-blur-md shadow-lg py-3' : 'bg-transparent py-6'}`}>
        <div className="container mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold ${scrolled ? 'bg-white text-layer-primary' : 'bg-white text-layer-primary'}`}>
              <i className="fa-solid fa-layer-group"></i>
            </div>
            <span className={`text-2xl font-bold tracking-wider ${scrolled ? 'text-white' : 'text-white'}`}>LAYER</span>
          </div>
          <div className="flex gap-4">
            <Link to="/login" className={`px-6 py-2 rounded-full font-bold transition ${scrolled ? 'text-white hover:bg-white/20' : 'bg-white/10 backdrop-blur-sm text-white hover:bg-white/20'}`}>
              Login
            </Link>
            <Link to="/signup" className={`px-6 py-2 rounded-full font-bold transition shadow-lg ${scrolled ? 'bg-white text-layer-dark hover:scale-105' : 'bg-white text-layer-btn hover:bg-gray-100 hover:text-layer-dark'}`}>
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      {/* Banner with Geometric Background */}
      <div 
        className="w-full text-center py-48 md:py-64 relative overflow-hidden"
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
          <h1 className="text-6xl md:text-9xl font-bold mb-8 drop-shadow-2xl animate-fade-in-up">Layer</h1>
          <p className="text-xl md:text-3xl font-light mb-12 drop-shadow-lg max-w-2xl mx-auto">The AI-Powered Smart Closet & Stylist.</p>
          <div className="flex justify-center gap-6 flex-wrap">
            <Link to="/signup" className="bg-white text-layer-btn px-8 py-4 rounded-lg text-xl md:text-2xl font-bold hover:bg-gray-100 hover:scale-105 transition-all shadow-lg ring-4 ring-white/20">
              Get Started
            </Link>
          </div>
        </div>
      </div>

      {/* Style Struggle Section */}
      <div className="bg-white py-24 px-4 text-center">
        <h3 className="text-4xl md:text-6xl text-layer-btn font-bold mb-16">Solve Your Daily Style Struggle</h3>
        
        <div className="max-w-4xl mx-auto border-l-4 border-layer-primary pl-8 text-left space-y-8">
          <div>
            <p className="text-2xl md:text-3xl font-bold text-layer-problem mb-2">"I have nothing to wear."</p>
            <p className="text-xl md:text-2xl text-layer-btn border-b border-dashed border-gray-200 pb-4">Layer generates outfits from <span className="italic">your</span> clothes.</p>
          </div>
          <div>
            <p className="text-2xl md:text-3xl font-bold text-layer-problem mb-2">"I waste too much time in the morning."</p>
            <p className="text-xl md:text-2xl text-layer-btn border-b border-dashed border-gray-200 pb-4">Get instant, tailored suggestions in seconds.</p>
          </div>
          <div>
            <p className="text-2xl md:text-3xl font-bold text-layer-problem mb-2">"My closet is overwhelming."</p>
            <p className="text-xl md:text-2xl text-layer-btn">Organize, track, and use every item you own.</p>
          </div>
        </div>

        <div className="mt-16">
          <Link to="/signup" className="inline-block bg-layer-btn text-white px-10 py-6 rounded-lg text-2xl md:text-3xl font-bold hover:bg-layer-dark hover:scale-105 transition-all shadow-xl">
            Stop Overthinking, Start Styling
          </Link>
        </div>
      </div>

      {/* Tech Advantage */}
      <div className="bg-layer-primary text-white py-20 px-4 text-center">
        <h3 className="text-4xl md:text-6xl font-bold mb-12">Powered by Style AI</h3>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-around gap-8">
          <div className="flex-1 p-4">
            <h4 className="text-3xl font-bold border-b-4 border-white pb-2 mb-4">Weather Aware</h4>
            <p className="text-xl leading-relaxed">Layer checks the local forecast to ensure your recommendations are always climate-appropriate.</p>
          </div>
          <div className="flex-1 p-4">
            <h4 className="text-3xl font-bold border-b-4 border-white pb-2 mb-4">Personal Style Profile</h4>
            <p className="text-xl leading-relaxed">Every outfit you save or discard teaches Layer more about your unique taste.</p>
          </div>
          <div className="flex-1 p-4">
            <h4 className="text-3xl font-bold border-b-4 border-white pb-2 mb-4">Inventory Tracking</h4>
            <p className="text-xl leading-relaxed">Never buy a duplicate again. See what you own and track how often you wear it.</p>
          </div>
        </div>
      </div>

      {/* Features Preview */}
      <div className="bg-blue-50 py-20 px-4 text-center">
        <h3 className="text-4xl md:text-6xl text-layer-dark font-bold mb-12">What can Layer do for you?</h3>
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 bg-white rounded-xl shadow-md">
            <i className="fa-solid fa-camera text-6xl text-layer-primary mb-4"></i>
            <h4 className="text-3xl text-layer-primary font-bold mb-4">Digital Wardrobe</h4>
            <p className="text-xl">Snap photos of your clothes and build your digital closet.</p>
          </div>
          <div className="p-6 bg-white rounded-xl shadow-md">
            <i className="fa-solid fa-wand-magic-sparkles text-6xl text-layer-primary mb-4"></i>
            <h4 className="text-3xl text-layer-primary font-bold mb-4">Instant Outfits</h4>
            <p className="text-xl">Get personalized outfit recommendations for any occasion or weather.</p>
          </div>
          <div className="p-6 bg-white rounded-xl shadow-md">
            <i className="fa-solid fa-calendar-days text-6xl text-layer-primary mb-4"></i>
            <h4 className="text-3xl text-layer-primary font-bold mb-4">Plan & Organize</h4>
            <p className="text-xl">Use the Outfit Planner to schedule your looks for the week ahead.</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-layer-primary text-black py-24 text-center">
        <div className="flex flex-col md:flex-row justify-center gap-8">
          <a href="#" className="text-white text-2xl hover:text-layer-dark underline decoration-transparent hover:decoration-white transition">Privacy Policy</a>
          <a href="#" className="text-white text-2xl hover:text-layer-dark underline decoration-transparent hover:decoration-white transition">Terms of Service</a>
          <a href="#" className="text-white text-2xl hover:text-layer-dark underline decoration-transparent hover:decoration-white transition">Cookie preferences</a>
        </div>
        <p className="mt-8 text-white/80">© 2024 Layer App. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPage;