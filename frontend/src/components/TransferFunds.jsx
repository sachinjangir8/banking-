import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const TransferFunds = () => {
  const { user } = useContext(AuthContext);
  const [accounts, setAccounts] = useState([]);
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [formData, setFormData] = useState({
    fromAccountId: '',
    toAccountId: '',
    amount: ''
  });
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
          setFormData(prev => ({ ...prev, fromAccountId: res.data.accounts[0].account_id.toString() }));
        }

        const benRes = await axios.get(`${apiUrl}/beneficiaries`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setBeneficiaries(benRes.data);
      } catch (err) {
        console.error('Failed to load accounts or beneficiaries');
      }
    };
    if (user) fetchAccounts();
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await axios.post(`${apiUrl}/transfer`, {
        fromAccountId: parseInt(formData.fromAccountId),
        toAccountId: parseInt(formData.toAccountId),
        amount: parseFloat(formData.amount)
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      
      setMessage(response.data.message || 'Transfer successful');
      setFormData({ ...formData, toAccountId: '', amount: '' });
      
      // Update local balance correctly for both source and destination (if user owns both)
      setAccounts(accounts.map(acc => {
        let newBalance = parseFloat(acc.balance);
        if (acc.account_id === parseInt(formData.fromAccountId)) {
          newBalance -= parseFloat(formData.amount);
        } else if (acc.account_id === parseInt(formData.toAccountId)) {
          newBalance += parseFloat(formData.amount);
        }
        return { ...acc, balance: newBalance };
      }));
    } catch (err) {
      setError(err.response?.data?.error || 'Transfer failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto glass-panel p-8">
      <h1 className="text-3xl font-bold text-white mb-6">Transfer Funds</h1>
      
      {message && (
        <div className="bg-green-900/50 border border-green-800 text-green-300 p-4 rounded mb-6">
          {message}
        </div>
      )}
      
      {error && (
        <div className="bg-red-900/50 border border-red-800 text-red-300 p-4 rounded mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm text-gray-400 mb-2">From Account</label>
          <select 
            name="fromAccountId" 
            value={formData.fromAccountId} 
            onChange={handleChange}
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
          <label className="block text-sm text-gray-400 mb-2">To Account (Beneficiary)</label>
          <div className="flex gap-4">
            <select
              className="flex-1 bg-brand-dark border border-gray-600 rounded px-4 py-3 text-white appearance-none"
              onChange={(e) => {
                if (e.target.value) {
                  setFormData({ ...formData, toAccountId: e.target.value });
                }
              }}
            >
              <option value="">-- Select Beneficiary --</option>
              {beneficiaries.map(ben => (
                <option key={ben.beneficiary_id} value={ben.beneficiary_account_id}>
                  {ben.nickname} (Acct #{ben.beneficiary_account_id})
                </option>
              ))}
            </select>
            <div className="flex items-center text-gray-400 font-bold">OR</div>
            <input 
              type="number" 
              name="toAccountId" 
              value={formData.toAccountId} 
              onChange={handleChange}
              className="flex-1 bg-brand-dark border border-gray-600 rounded px-4 py-3 text-white"
              placeholder="Enter Account ID"
              required
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm text-gray-400 mb-2">Amount (₹)</label>
          <input 
            type="number" 
            name="amount" 
            value={formData.amount} 
            onChange={handleChange}
            min="0.01" step="0.01" required
            className="w-full bg-brand-dark border border-gray-600 rounded px-4 py-3 text-white text-xl"
            placeholder="0.00"
          />
        </div>
        
        <button 
          type="submit" 
          disabled={loading || !formData.fromAccountId}
          className="w-full bg-brand-primary hover:bg-brand-hover text-white font-bold py-4 rounded transition-colors text-lg disabled:opacity-50"
        >
          {loading ? 'Processing Transfer...' : 'Execute Transfer'}
        </button>
      </form>
    </div>
  );
};

export default TransferFunds;
