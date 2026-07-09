import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Register = () => {
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: ''
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await register(formData);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto glass-panel p-8 mt-10">
      <h2 className="text-3xl font-bold text-white mb-6 text-center">Create Account</h2>
      {error && (
        <div className="bg-red-900/50 border border-red-800 text-red-300 p-3 rounded mb-4 text-center">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">First Name</label>
            <input 
              name="firstName" type="text" required
              className="w-full bg-brand-dark border border-gray-600 rounded px-4 py-2 text-white"
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Last Name</label>
            <input 
              name="lastName" type="text" required
              className="w-full bg-brand-dark border border-gray-600 rounded px-4 py-2 text-white"
              onChange={handleChange}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Email</label>
          <input 
            name="email" type="email" required
            className="w-full bg-brand-dark border border-gray-600 rounded px-4 py-2 text-white"
            onChange={handleChange}
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Phone</label>
          <input 
            name="phone" type="text" required
            className="w-full bg-brand-dark border border-gray-600 rounded px-4 py-2 text-white"
            onChange={handleChange}
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Password</label>
          <input 
            name="password" type="password" required
            className="w-full bg-brand-dark border border-gray-600 rounded px-4 py-2 text-white"
            onChange={handleChange}
          />
        </div>
        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-brand-primary hover:bg-blue-600 text-white font-bold py-3 px-4 rounded mt-4 transition-colors disabled:opacity-50"
        >
          {loading ? 'Creating Account...' : 'Register'}
        </button>
      </form>

      <div className="mt-6 text-center text-gray-400 text-sm">
        Already have an account? <Link to="/login" className="text-brand-accent hover:underline">Log in</Link>
      </div>
    </div>
  );
};

export default Register;
