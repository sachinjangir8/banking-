import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const Beneficiaries = () => {
  const { user } = useContext(AuthContext);
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [accountId, setAccountId] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });

  const fetchBeneficiaries = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await axios.get(`${apiUrl}/beneficiaries`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setBeneficiaries(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchBeneficiaries();
  }, [user]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });
    
    if (!accountId || !nickname) {
        setMessage({ text: 'Please fill in all fields', type: 'error' });
        return;
    }

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await axios.post(`${apiUrl}/beneficiaries`, 
        { beneficiaryAccountId: parseInt(accountId), nickname },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      
      setMessage({ text: response.data.message, type: 'success' });
      setAccountId('');
      setNickname('');
      fetchBeneficiaries();
    } catch (err) {
      setMessage({ text: err.response?.data?.error || 'Failed to add beneficiary', type: 'error' });
    }
  };

  const handleRemove = async (id) => {
    if (!window.confirm('Are you sure you want to remove this beneficiary?')) return;
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await axios.delete(`${apiUrl}/beneficiaries/${id}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setMessage({ text: response.data.message, type: 'success' });
      fetchBeneficiaries();
    } catch (err) {
      setMessage({ text: err.response?.data?.error || 'Failed to remove beneficiary', type: 'error' });
    }
  };

  return (
    <div className="space-y-8">
      <div className="glass-panel p-8">
        <h1 className="text-3xl font-bold text-white mb-2">Manage Beneficiaries</h1>
        <p className="text-gray-400">Add accounts you frequently transfer money to.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="glass-panel p-8">
          <h2 className="text-xl font-bold text-white mb-6">Add New Beneficiary</h2>
          
          {message.text && (
            <div className={`p-4 mb-6 rounded ${message.type === 'error' ? 'bg-red-900/50 text-red-200 border border-red-800' : 'bg-green-900/50 text-green-200 border border-green-800'}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label className="block text-gray-400 text-sm mb-2">Account ID</label>
              <input
                type="number"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white focus:border-brand-primary outline-none transition-colors"
                placeholder="Enter Account ID"
                required
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-2">Nickname</label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white focus:border-brand-primary outline-none transition-colors"
                placeholder="e.g. Landlord, John Doe"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-brand-primary text-gray-900 font-bold py-3 px-4 rounded hover:bg-brand-accent transition-colors mt-4"
            >
              Add Beneficiary
            </button>
          </form>
        </div>

        <div className="glass-panel p-8">
          <h2 className="text-xl font-bold text-white mb-6">Saved Beneficiaries</h2>
          
          {loading ? (
            <p className="text-gray-400">Loading...</p>
          ) : beneficiaries.length === 0 ? (
            <p className="text-gray-400 italic">No beneficiaries saved yet.</p>
          ) : (
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {beneficiaries.map(ben => (
                <div key={ben.beneficiary_id} className="bg-gray-800 p-4 rounded border border-gray-700 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold text-white">{ben.nickname}</h3>
                    <p className="text-sm text-gray-400">Account #{ben.beneficiary_account_id} • {ben.account_type}</p>
                  </div>
                  <button
                    onClick={() => handleRemove(ben.beneficiary_id)}
                    className="text-red-400 hover:text-red-300 text-sm border border-red-900 hover:bg-red-900/30 px-3 py-1 rounded transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Beneficiaries;
