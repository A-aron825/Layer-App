
import React from 'react';
import { Link } from 'react-router-dom';

const PrivacyPage: React.FC = () => {
  return (
    <div className="bg-layer-bg min-h-screen font-sans text-layer-dark selection:bg-layer-primary selection:text-white">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 py-6">
        <div className="container mx-auto px-8 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl font-black bg-layer-dark text-white shadow-lg group-hover:rotate-6 transition-transform">
              <i className="fa-solid fa-layer-group"></i>
            </div>
            <span className="text-2xl font-black tracking-tighter">LAYER</span>
          </Link>
          <Link to="/signup" className="text-sm font-black uppercase tracking-widest hover:text-layer-primary transition">Get Started</Link>
        </div>
      </nav>

      <main className="container mx-auto px-8 pt-40 pb-32 max-w-4xl">
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-12 uppercase leading-none">Vault Privacy</h1>
        <p className="text-xl md:text-2xl font-bold text-gray-500 italic mb-16 leading-relaxed">Your style data is your identity. We protect it with neural-grade encryption.</p>

        <div className="space-y-20">
          <section>
            <h2 className="text-xs font-black uppercase tracking-[0.4em] text-layer-primary mb-6">01. Data Sovereignty</h2>
            <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border-l-[12px] border-layer-primary">
              <p className="text-lg leading-relaxed font-medium text-gray-700">
                Every item scanned into your Style Vault remains your property. Layer does not sell, trade, or expose your wardrobe data to third-party retailers. Your aesthetic is yours alone.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xs font-black uppercase tracking-[0.4em] text-layer-btn mb-6">02. Neural Processing</h2>
            <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border-l-[12px] border-layer-btn">
              <p className="text-lg leading-relaxed font-medium text-gray-700">
                Our AI models process your images locally whenever possible. Cloud-based analysis is performed on ephemeral instances that are wiped immediately after the style metadata is extracted.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xs font-black uppercase tracking-[0.4em] text-gray-400 mb-6">03. Transparency</h2>
            <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border-l-[12px] border-gray-200">
              <p className="text-lg leading-relaxed font-medium text-gray-700">
                You can export or purge your entire Style Vault at any time. We believe in absolute transparency regarding how our algorithms interpret your fashion choices.
              </p>
            </div>
          </section>
        </div>

      </main>

      <footer className="py-20 text-center border-t border-gray-100">
        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">© 2025 LAYER NEURAL STYLIST</p>
      </footer>
    </div>
  );
};

export default PrivacyPage;
