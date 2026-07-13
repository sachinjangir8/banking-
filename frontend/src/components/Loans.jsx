import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const Loans = () => {
  const { user } = useContext(AuthContext);
  const [loans, setLoans] = useState([]);
  const [loanType, setLoanType] = useState('Personal');
  const [amount, setAmount] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });

  const fetchLoans = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await axios.get(`${apiUrl}/loans`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setLoans(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchLoans();
  }, [user]);

  const handleApply = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });
    
    if (!amount || !interestRate || parseFloat(amount) <= 0) {
        setMessage({ text: 'Please enter valid amount and interest rate', type: 'error' });
        return;
    }

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await axios.post(`${apiUrl}/loans`, 
        { 
          loanType, 
          amount: parseFloat(amount), 
          interestRate: parseFloat(interestRate) 
        },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      
      setMessage({ text: response.data.message, type: 'success' });
      setAmount('');
      setInterestRate('');
      fetchLoans();
    } catch (err) {
      setMessage({ text: err.response?.data?.error || 'Failed to apply for loan', type: 'error' });
    }
  };

  return (
    <div className="space-y-8">
      <div className="glass-panel p-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Loan Center</h1>
          <p className="text-gray-400">Apply for loans and manage your active loans.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="glass-panel p-8 lg:col-span-1 h-fit">
          <h2 className="text-xl font-bold text-white mb-6">Apply for a Loan</h2>
          
          {message.text && (
            <div className={`p-4 mb-6 rounded ${message.type === 'error' ? 'bg-red-900/50 text-red-200 border border-red-800' : 'bg-green-900/50 text-green-200 border border-green-800'}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleApply} className="space-y-4">
            <div>
              <label className="block text-gray-400 text-sm mb-2">Loan Type</label>
              <select
                value={loanType}
                onChange={(e) => setLoanType(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white focus:border-brand-primary outline-none transition-colors"
              >
                <option value="Personal">Personal Loan</option>
                <option value="Home">Home Loan</option>
                <option value="Auto">Auto Loan</option>
                <option value="Education">Education Loan</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-2">Amount (₹)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white focus:border-brand-primary outline-none transition-colors"
                placeholder="e.g. 50000"
                required
                min="1000"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-2">Interest Rate (%)</label>
              <input
                type="number"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white focus:border-brand-primary outline-none transition-colors"
                placeholder="e.g. 10.5"
                required
                step="0.1"
                min="0"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-brand-primary text-gray-900 font-bold py-3 px-4 rounded hover:bg-brand-accent transition-colors mt-4"
            >
              Submit Application
            </button>
          </form>
        </div>

        <div className="glass-panel p-8 lg:col-span-2">
          <h2 className="text-xl font-bold text-white mb-6">Your Loans</h2>
          
          {loading ? (
            <p className="text-gray-400">Loading...</p>
          ) : loans.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg">You don't have any loans yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-700 text-gray-400 text-sm uppercase">
                    <th className="pb-3 font-semibold">Loan ID</th>
                    <th className="pb-3 font-semibold">Type</th>
                    <th className="pb-3 font-semibold">Amount</th>
                    <th className="pb-3 font-semibold">Interest</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold">Applied On</th>
                  </tr>
                </thead>
                <tbody className="text-white">
                  {loans.map(loan => (
                    <tr key={loan.loan_id} className="border-b border-gray-800 hover:bg-gray-800/30 transition-colors">
                      <td className="py-4">#{loan.loan_id}</td>
                      <td className="py-4 font-medium">{loan.loan_type}</td>
                      <td className="py-4">₹{parseFloat(loan.amount).toFixed(2)}</td>
                      <td className="py-4">{parseFloat(loan.interest_rate).toFixed(2)}%</td>
                      <td className="py-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          loan.status === 'Active' ? 'bg-green-900 text-green-300' : 
                          loan.status === 'Pending' ? 'bg-yellow-900 text-yellow-300' :
                          loan.status === 'Closed' ? 'bg-gray-700 text-gray-300' :
                          'bg-red-900 text-red-300'
                        }`}>
                          {loan.status}
                        </span>
                      </td>
                      <td className="py-4 text-gray-400 text-sm">
                        {new Date(loan.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Loans;
