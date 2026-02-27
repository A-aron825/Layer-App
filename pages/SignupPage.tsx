import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { backend } from '../services/backend';

const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    setLoading(true);
    try {
      await backend.signup({
        email: formData.email,
        username: formData.username,
        password: formData.password,
        styles: [] // Default styles
      });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
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

      <div className="bg-white/10 backdrop-blur-lg border border-white/20 p-10 rounded-2xl shadow-2xl w-full max-w-lg relative z-10">
        <h1 className="text-4xl font-bold text-center text-white mb-8">Create Account</h1>
        
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-white p-3 rounded mb-4 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white/80 font-bold mb-1">Email*</label>
            <input 
              type="email" 
              name="email"
              value={formData.email}
              onChange={handleChange}
              required 
              className="w-full px-4 py-2 rounded border border-white/20 focus:outline-none focus:ring-2 focus:ring-layer-primary bg-white/10 text-white placeholder-white/40" 
              placeholder="you@example.com" 
            />
          </div>

          <div>
            <label className="block text-white/80 font-bold mb-1">Username*</label>
            <input 
              type="text" 
              name="username"
              value={formData.username}
              onChange={handleChange}
              required 
              className="w-full px-4 py-2 rounded border border-white/20 focus:outline-none focus:ring-2 focus:ring-layer-primary bg-white/10 text-white placeholder-white/40" 
              placeholder="StyleMaster" 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-white/80 font-bold mb-1">Password*</label>
               <input 
                 type="password" 
                 name="password"
                 value={formData.password}
                 onChange={handleChange}
                 required 
                 className="w-full px-4 py-2 rounded border border-white/20 focus:outline-none focus:ring-2 focus:ring-layer-primary bg-white/10 text-white placeholder-white/40" 
                 placeholder="••••••••" 
               />
             </div>
             <div>
               <label className="block text-white/80 font-bold mb-1">Confirm*</label>
               <input 
                 type="password" 
                 name="confirmPassword"
                 value={formData.confirmPassword}
                 onChange={handleChange}
                 required 
                 className="w-full px-4 py-2 rounded border border-white/20 focus:outline-none focus:ring-2 focus:ring-layer-primary bg-white/10 text-white placeholder-white/40" 
                 placeholder="••••••••" 
               />
             </div>
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-layer-btn text-white font-bold py-3 rounded-lg shadow-lg hover:bg-layer-dark hover:scale-[1.02] transition transform active:scale-95 mt-4 disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>
        
        <p className="text-center mt-6 text-white/80">
          Already have an account? <Link to="/login" className="text-layer-primary font-bold hover:text-white hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;