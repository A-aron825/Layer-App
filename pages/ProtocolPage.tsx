
import React from 'react';
import { Link } from 'react-router-dom';

const ProtocolPage: React.FC = () => {
  return (
    <div className="bg-layer-dark min-h-screen font-sans text-white selection:bg-layer-primary selection:text-white">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-layer-dark/80 backdrop-blur-md border-b border-white/10 py-6">
        <div className="container mx-auto px-8 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl font-black bg-white text-layer-dark shadow-lg group-hover:rotate-6 transition-transform">
              <i className="fa-solid fa-layer-group"></i>
            </div>
            <span className="text-2xl font-black tracking-tighter">LAYER</span>
          </Link>
          <Link to="/signup" className="text-sm font-black uppercase tracking-widest hover:text-layer-primary transition">Join Protocol</Link>
        </div>
      </nav>

      <main className="container mx-auto px-8 pt-40 pb-32 max-w-5xl">
        <h1 className="text-6xl md:text-[10rem] font-black tracking-tighter mb-12 uppercase leading-none text-layer-primary">Style Protocol</h1>
        <p className="text-xl md:text-3xl font-bold text-white/50 italic mb-24 leading-relaxed max-w-3xl">The algorithmic rules governing the Layer ecosystem. Our commitment to sustainable, intelligent fashion.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <section className="bg-white/5 p-12 rounded-[3rem] border-t-[16px] border-layer-primary shadow-2xl">
            <h2 className="text-xs font-black uppercase tracking-[0.4em] text-layer-primary mb-8">01. Anti-Indecision</h2>
            <p className="text-xl leading-relaxed font-bold text-white/80">
              The Protocol dictates that every user should spend less than 60 seconds selecting an ensemble. Our neural engine is optimized for speed, not endless scrolling.
            </p>
          </section>

          <section className="bg-white/5 p-12 rounded-[3rem] border-t-[16px] border-layer-btn shadow-2xl">
            <h2 className="text-xs font-black uppercase tracking-[0.4em] text-layer-btn mb-8">02. Sustainability First</h2>
            <p className="text-xl leading-relaxed font-bold text-white/80">
              We prioritize the reuse of existing wardrobe items. The Protocol discourages fast-fashion impulse buys by highlighting the hidden potential in your current closet.
            </p>
          </section>

          <section className="bg-white/5 p-12 rounded-[3rem] border-t-[16px] border-gray-400 shadow-2xl">
            <h2 className="text-xs font-black uppercase tracking-[0.4em] text-gray-400 mb-8">03. Aesthetic Integrity</h2>
            <p className="text-xl leading-relaxed font-bold text-white/80">
              Layer respects individual style DNA. The Protocol ensures that AI suggestions are personalized, not generic trends. Your unique vibe is our primary constraint.
            </p>
          </section>

          <section className="bg-white/5 p-12 rounded-[3rem] border-t-[16px] border-white shadow-2xl">
            <h2 className="text-xs font-black uppercase tracking-[0.4em] text-white mb-8">04. Community Ethics</h2>
            <p className="text-xl leading-relaxed font-bold text-white/80">
              The Global Feed is a space for inspiration, not competition. The Protocol enforces a positive, inclusive environment for style exploration.
            </p>
          </section>
        </div>

        <div className="mt-32 p-16 bg-white text-layer-dark rounded-[4rem] shadow-2xl flex flex-col md:flex-row items-center gap-12">
           <div className="flex-1">
              <h3 className="text-4xl font-black mb-6 uppercase tracking-tight">Protocol Compliance</h3>
              <p className="text-gray-500 font-bold text-lg leading-relaxed">By using Layer, you agree to the Style Protocol. We're building a smarter, more intentional future for fashion together.</p>
           </div>
           <Link to="/signup" className="bg-layer-dark text-white px-12 py-6 rounded-2xl font-black uppercase tracking-widest hover:scale-105 transition shadow-xl whitespace-nowrap">Accept Protocol</Link>
        </div>
      </main>

      <footer className="py-20 text-center border-t border-white/10">
        <p className="text-white/40 font-bold uppercase tracking-widest text-xs">© 2025 LAYER NEURAL STYLIST</p>
      </footer>
    </div>
  );
};

export default ProtocolPage;
