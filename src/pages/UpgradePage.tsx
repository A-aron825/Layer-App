import React from 'react';
import Navigation from '../components/Navigation';

const UpgradePage: React.FC = () => {
  return (
    <div className="bg-layer-bg min-h-screen font-sans">
      <Navigation />
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-layer-dark mb-4">Upgrade Your Style</h1>
        <p className="text-xl text-gray-600 mb-16 max-w-2xl mx-auto">Unlock advanced AI features, unlimited closet space, and personal styling sessions.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          
          {/* Basic Plan */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 flex flex-col hover:scale-105 transition duration-300">
             <h3 className="text-2xl font-bold text-gray-800 mb-2">Starter</h3>
             <div className="text-4xl font-bold text-layer-primary mb-6">$0<span className="text-base font-normal text-gray-500">/mo</span></div>
             <ul className="text-left space-y-4 mb-8 flex-1">
               <li className="flex items-center gap-2"><i className="fa-solid fa-check text-green-500"></i> Up to 50 Items</li>
               <li className="flex items-center gap-2"><i className="fa-solid fa-check text-green-500"></i> Basic Outfit Generator</li>
               <li className="flex items-center gap-2"><i className="fa-solid fa-check text-green-500"></i> 1 Capsule Wardrobe</li>
             </ul>
             <button className="w-full py-3 rounded-lg border-2 border-gray-200 font-bold text-gray-600 hover:border-gray-400 hover:bg-gray-50 transition">Current Plan</button>
          </div>

          {/* Pro Plan */}
          <div className="bg-white rounded-2xl p-8 shadow-2xl border-2 border-layer-btn flex flex-col relative transform scale-105 z-10">
             <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-layer-btn text-white px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wider">Most Popular</div>
             <h3 className="text-2xl font-bold text-layer-dark mb-2">Style Pro</h3>
             <div className="text-4xl font-bold text-layer-dark mb-6">$9.99<span className="text-base font-normal text-gray-500">/mo</span></div>
             <ul className="text-left space-y-4 mb-8 flex-1">
               <li className="flex items-center gap-2"><i className="fa-solid fa-check text-green-500"></i> Unlimited Items</li>
               <li className="flex items-center gap-2"><i className="fa-solid fa-check text-green-500"></i> Advanced AI Stylist</li>
               <li className="flex items-center gap-2"><i className="fa-solid fa-check text-green-500"></i> Travel Packer</li>
               <li className="flex items-center gap-2"><i className="fa-solid fa-check text-green-500"></i> Trend Forecasting</li>
               <li className="flex items-center gap-2"><i className="fa-solid fa-check text-green-500"></i> Resale Analytics</li>
             </ul>
             <button className="w-full py-3 rounded-lg bg-layer-btn text-white font-bold hover:bg-layer-dark transition shadow-lg">Upgrade Now</button>
          </div>

          {/* Elite Plan */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 flex flex-col hover:scale-105 transition duration-300">
             <h3 className="text-2xl font-bold text-purple-800 mb-2">Elite</h3>
             <div className="text-4xl font-bold text-purple-600 mb-6">$29.99<span className="text-base font-normal text-gray-500">/mo</span></div>
             <ul className="text-left space-y-4 mb-8 flex-1">
               <li className="flex items-center gap-2"><i className="fa-solid fa-check text-green-500"></i> Everything in Pro</li>
               <li className="flex items-center gap-2"><i className="fa-solid fa-check text-green-500"></i> Human Stylist Review</li>
               <li className="flex items-center gap-2"><i className="fa-solid fa-check text-green-500"></i> Priority Support</li>
               <li className="flex items-center gap-2"><i className="fa-solid fa-check text-green-500"></i> Early Access Features</li>
             </ul>
             <button className="w-full py-3 rounded-lg bg-purple-100 text-purple-700 font-bold hover:bg-purple-200 transition">Contact Sales</button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default UpgradePage;