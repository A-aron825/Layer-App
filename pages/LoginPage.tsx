import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { backend } from '../services/backend';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [view, setView] = useState<'login' | 'forgot'>('login');
  const [resetSent, setResetSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await backend.login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setResetSent(true);
  }

  const handleSocialLogin = (provider: string) => {
    // Simulate social login delay
    const btn = document.getElementById(`btn-${provider}`);
    if(btn) btn.classList.add('opacity-50', 'cursor-not-allowed');
    
    setTimeout(() => {
      // Create a dummy user for social login simulation
      backend.signup({
        email: `guest_${Date.now()}@example.com`,
        username: 'Guest User',
        password: 'password',
        styles: []
      }).then(() => navigate('/dashboard'))
        .catch(() => backend.login(`guest_${Date.now()}@example.com`, 'password').then(() => navigate('/dashboard')));
    }, 800);
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-cover bg-center" 
      style={{ 
        backgroundColor: '#0f172a',
        backgroundImage: `
          radial-gradient(at 0% 0%, hsla(253,16%,7%,1) 0, transparent 50%), 
          radial-gradient(at 50% 0%, hsla(225,39%,30%,1) 0, transparent 50%), 
          radial-gradient(at 100% 0%, hsla(339,49%,30%,1) 0, transparent 50%)
        `,
        backgroundSize: 'cover'
      }}
    >
      <div className="absolute inset-0 opacity-20" style={{ 
          backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
      }}></div>

      <div className="bg-white/10 backdrop-blur-lg border border-white/20 p-10 rounded-2xl shadow-2xl w-full max-w-md relative z-10 transition-all duration-300">
        
        {view === 'login' ? (
          <>
            <h1 className="text-4xl font-bold text-center text-white mb-8">Welcome Back</h1>
            
            {error && (
              <div className="bg-red-500/20 border border-red-500 text-white p-3 rounded mb-4 text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-white/80 font-bold mb-2">Email</label>
                <input 
                  type="text" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-layer-primary focus:border-transparent transition bg-white/10 text-white placeholder-white/40"
                  placeholder="Enter your email"
                />
              </div>
              
              <div>
                <label className="block text-white/80 font-bold mb-2">Password</label>
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-layer-primary focus:border-transparent transition bg-white/10 text-white placeholder-white/40"
                  placeholder="••••••••"
                />
              </div>
              
              <div className="text-right">
                <button type="button" onClick={() => setView('forgot')} className="text-sm text-layer-primary hover:text-white hover:underline transition">Forgot Password?</button>
              </div>
              
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-layer-btn text-white font-bold py-3 rounded-lg shadow-lg hover:bg-layer-dark hover:scale-[1.02] transition transform active:scale-95 disabled:opacity-50"
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>
            
            <div className="flex items-center my-8">
              <div className="flex-grow border-t border-white/20"></div>
              <span className="mx-4 text-sm text-white/60">Or continue with</span>
              <div className="flex-grow border-t border-white/20"></div>
            </div>
            
            <div className="space-y-3">
              <button 
                id="btn-google"
                type="button" 
                onClick={() => handleSocialLogin('google')}
                className="w-full bg-white text-gray-700 font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-3 hover:bg-gray-100 transition transform active:scale-95 shadow"
              >
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
                Continue with Google
              </button>
              <button 
                id="btn-facebook"
                type="button" 
                onClick={() => handleSocialLogin('facebook')}
                className="w-full bg-[#1877F2] text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-3 hover:bg-[#155db2] transition transform active:scale-95 shadow"
              >
                <i className="fa-brands fa-facebook-f"></i>
                Continue with Facebook
              </button>
            </div>
            
            <p className="text-center mt-8 text-white/80">
              Don't have an account? <Link to="/signup" className="text-layer-primary font-bold hover:text-white hover:underline">Sign Up</Link>
            </p>
          </>
        ) : (
          <div className="animate-fade-in">
             <button onClick={() => { setView('login'); setResetSent(false); }} className="text-white/60 hover:text-white mb-6 flex items-center gap-2 transition">
               <i className="fa-solid fa-arrow-left"></i> Back to Login
             </button>
             
             <h1 className="text-3xl font-bold text-center text-white mb-4">Reset Password</h1>
             
             {!resetSent ? (
               <form onSubmit={handleForgotPasswordSubmit} className="space-y-6">
                  <p className="text-white/80 text-center mb-4">Enter your email address and we'll send you a link to reset your password.</p>
                  <div>
                    <label className="block text-white/80 font-bold mb-2">Email Address</label>
                    <input 
                      type="email" 
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-layer-primary focus:border-transparent transition bg-white/10 text-white placeholder-white/40"
                      placeholder="you@example.com"
                    />
                  </div>
                  <button type="submit" className="w-full bg-layer-primary text-white font-bold py-3 rounded-lg shadow-lg hover:bg-white hover:text-layer-primary transition transform active:scale-95">
                    Send Reset Link
                  </button>
               </form>
             ) : (
               <div className="text-center py-8 animate-fade-in">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-green-400 border-2 border-green-500">
                    <i className="fa-solid fa-check text-2xl"></i>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Check your inbox!</h3>
                  <p className="text-white/70 mb-6">We've sent a password reset link to <span className="font-bold text-white">{email}</span>.</p>
                  <button onClick={() => setView('login')} className="w-full bg-white/10 text-white font-bold py-3 rounded-lg hover:bg-white/20 transition">
                    Return to Login
                  </button>
               </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginPage;