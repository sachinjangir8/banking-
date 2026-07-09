import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const ManageFunds = () => {
  const { user } = useContext(AuthContext);
  const [accounts, setAccounts] = useState([]);
  const [accountId, setAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [action, setAction] = useState('deposit');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const res = await axios.get(`${apiUrl}/me`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setAccounts(res.data.accounts);
        if (res.data.accounts.length > 0) {
          setAccountId(res.data.accounts[0].account_id);
        }
      } catch (err) {
        console.error('Failed to load accounts');
      }
    };
    if (user) fetchAccounts();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const endpoint = action === 'deposit' ? '/deposit' : '/withdraw';
      
      const res = await axios.post(`${apiUrl}${endpoint}`, {
        accountId: parseInt(accountId),
        amount: parseFloat(amount)
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      setMessage(res.data.message);
      setAmount('');
      
      // Update local balance
      setAccounts(accounts.map(acc => {
        if (acc.account_id === parseInt(accountId)) {
          return {
            ...acc,
            balance: action === 'deposit' 
              ? parseFloat(acc.balance) + parseFloat(amount)
              : parseFloat(acc.balance) - parseFloat(amount)
          };
        }
        return acc;
      }));

    } catch (err) {
      setError(err.response?.data?.error || 'Transaction failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto glass-panel p-8">
      <h1 className="text-3xl font-bold text-white mb-6">Manage Funds</h1>
      
      <div className="flex space-x-4 mb-6">
        <button 
          onClick={() => setAction('deposit')}
          className={`flex-1 py-3 rounded font-bold transition-colors ${action === 'deposit' ? 'bg-green-600 text-white' : 'bg-brand-dark text-gray-400 border border-gray-700 hover:bg-gray-800'}`}
        >
          Deposit Cash
        </button>
        <button 
          onClick={() => setAction('withdraw')}
          className={`flex-1 py-3 rounded font-bold transition-colors ${action === 'withdraw' ? 'bg-red-600 text-white' : 'bg-brand-dark text-gray-400 border border-gray-700 hover:bg-gray-800'}`}
        >
          Withdraw Cash
        </button>
      </div>

      {message && <div className="bg-green-900/50 border border-green-800 text-green-300 p-4 rounded mb-6">{message}</div>}
      {error && <div className="bg-red-900/50 border border-red-800 text-red-300 p-4 rounded mb-6">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm text-gray-400 mb-2">Select Account</label>
          <select 
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="w-full bg-brand-dark border border-gray-600 rounded px-4 py-3 text-white appearance-none"
            required
          >
            {accounts.map(acc => (
              <option key={acc.account_id} value={acc.account_id}>
                Account #{acc.account_id} ({acc.account_type}) - Balance: ₹{parseFloat(acc.balance).toFixed(2)}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm text-gray-400 mb-2">Amount (₹)</label>
          <input 
            type="number" 
            min="0.01" step="0.01" required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-brand-dark border border-gray-600 rounded px-4 py-3 text-white text-xl"
            placeholder="0.00"
          />
        </div>

        <button 
          type="submit" 
          disabled={loading || !accountId}
          className={`w-full text-white font-bold py-4 rounded transition-colors text-lg disabled:opacity-50 ${action === 'deposit' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
        >
          {loading ? 'Processing...' : `Confirm ${action === 'deposit' ? 'Deposit' : 'Withdrawal'}`}
        </button>
      </form>
    </div>
  );
};

export default ManageFunds;
