import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const response = await axios.get(`${apiUrl}/me`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setProfile(response.data.profile);
        setAccounts(response.data.accounts);
      } catch (err) {
        setError('Failed to load your accounts. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchDashboard();
  }, [user]);

  if (loading) return <div className="text-center py-20 text-gray-300">Loading your profile...</div>;
  if (error) return <div className="glass-panel p-8 text-red-400 text-center">{error}</div>;

  const totalBalance = accounts.reduce((sum, acc) => sum + parseFloat(acc.balance), 0);

  return (
    <div className="space-y-8">
      <div className="glass-panel p-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">My Overview</h1>
          <p className="text-gray-400">Manage your accounts and track your balance.</p>
        </div>
        <div className="text-right">
          <p className="text-gray-400 text-sm uppercase tracking-wider mb-1">Total Net Worth</p>
          <p className="text-4xl font-black text-brand-accent">₹{totalBalance.toFixed(2)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map((account) => (
          <Link 
            to={`/account/${account.account_id}`} 
            key={account.account_id}
            className="glass-panel p-6 hover:border-brand-primary transition-all duration-300 transform hover:-translate-y-1 block group"
          >
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold text-white group-hover:text-brand-primary transition-colors">
                {account.account_type}
              </h2>
              <span className={`text-xs px-2 py-1 rounded-full ${account.status === 'Active' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                {account.status}
              </span>
            </div>
            <p className="text-3xl font-light text-white mb-4">
              ₹{parseFloat(account.balance).toFixed(2)}
            </p>
            <div className="text-sm text-gray-400 flex justify-between items-center border-t border-gray-700 pt-4">
              <span>Account #{account.account_id}</span>
              <span className="text-brand-accent group-hover:underline">View Details &rarr;</span>
            </div>
          </Link>
        ))}
      </div>
      
      {accounts.length === 0 && (
        <div className="glass-panel p-10 text-center">
          <p className="text-gray-400 text-lg">You don't have any accounts open yet.</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
