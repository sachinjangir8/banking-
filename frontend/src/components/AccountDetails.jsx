import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const AccountDetails = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAccount = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const response = await axios.get(`${apiUrl}/accounts/${id}`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setAccount(response.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch account details');
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchAccount();
  }, [id, user]);

  if (loading) return <div className="text-center py-20 text-gray-300">Loading account...</div>;
  if (error) return <div className="glass-panel p-8 text-red-400 text-center">{error}</div>;
  if (!account) return <div className="glass-panel p-8 text-center text-gray-400">Account not found</div>;

  return (
    <div className="max-w-3xl mx-auto glass-panel p-8">
      <div className="flex justify-between items-center border-b border-gray-700 pb-6 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">{account.account_type} Account</h1>
          <p className="text-gray-400">Account ID: #{account.account_id}</p>
        </div>
        <span className={`px-4 py-1.5 rounded-full text-sm font-semibold ${account.status === 'Active' ? 'bg-green-900/50 text-green-400 border border-green-800' : 'bg-red-900/50 text-red-400 border border-red-800'}`}>
          {account.status}
        </span>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-brand-dark p-4 rounded border border-gray-700">
            <span className="block text-gray-500 text-sm mb-1">Currency</span>
            <span className="text-lg text-white font-medium">{account.currency}</span>
          </div>
          <div className="bg-brand-dark p-4 rounded border border-gray-700">
            <span className="block text-gray-500 text-sm mb-1">Opened On</span>
            <span className="text-lg text-white font-medium">
              {new Date(account.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div className="flex justify-between items-center bg-brand-dark p-6 rounded-lg border border-gray-700 mt-6 shadow-inner">
          <span className="text-gray-300 text-xl">Current Balance</span>
          <span className="text-3xl font-bold text-green-400">
            ₹{parseFloat(account.balance).toFixed(2)}
          </span>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-gray-700 text-center">
        <Link 
          to={`/account/${id}/statements`}
          className="inline-block bg-brand-secondary hover:bg-gray-700 border border-gray-600 text-white font-bold py-2 px-6 rounded transition-colors shadow-md"
        >
          View Statements & History
        </Link>
      </div>
    </div>
  );
};

export default AccountDetails;
