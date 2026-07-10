import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto glass-panel p-8 mt-10">
      <h2 className="text-3xl font-bold text-white mb-6 text-center">Welcome Back</h2>
      {error && (
        <div className="bg-red-900/50 border border-red-800 text-red-300 p-3 rounded mb-4 text-center">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Email</label>
          <input 
            type="email" 
            required
            className="w-full bg-brand-dark border border-gray-600 rounded px-4 py-2 text-white focus:outline-none focus:border-brand-primary"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Password</label>
          <input 
            type="password" 
            required
            className="w-full bg-brand-dark border border-gray-600 rounded px-4 py-2 text-white focus:outline-none focus:border-brand-primary"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-brand-primary hover:bg-brand-hover text-white font-bold py-3 px-4 rounded transition-colors disabled:opacity-50"
        >
          {loading ? 'Authenticating...' : 'Sign In'}
        </button>
      </form>

      <div className="mt-6 text-center text-gray-400 text-sm">
        Don't have an account? <Link to="/register" className="text-brand-accent hover:underline">Register</Link>
      </div>
      
      <div className="mt-8 p-4 bg-gray-900 rounded border border-gray-800 text-xs text-gray-500">
        <p className="font-semibold mb-1">Demo Credentials:</p>
        <p>Email: sachinjangir1319@gmail.com</p>
        <p>Password: 1234567</p>
      </div>
    </div>
  );
};

export default Login;
