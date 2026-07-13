import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({ totalUsers: 0, totalBalances: 0, pendingLoans: 0, totalTransactions: 0 });
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });

  const fetchData = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const [statsRes, loansRes] = await Promise.all([
        axios.get(`${apiUrl}/admin/stats`, { headers: { Authorization: `Bearer ${user.token}` } }),
        axios.get(`${apiUrl}/admin/loans`, { headers: { Authorization: `Bearer ${user.token}` } })
      ]);
      setStats(statsRes.data);
      setLoans(loansRes.data);
    } catch (err) {
      console.error(err);
      setMessage({ text: 'Failed to load admin data.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.isAdmin) fetchData();
  }, [user]);

  const handleApprove = async (id) => {
    if (!window.confirm('Are you sure you want to approve this loan and disburse funds?')) return;
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await axios.put(`${apiUrl}/admin/loans/${id}/approve`, {}, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setMessage({ text: response.data.message, type: 'success' });
      fetchData();
    } catch (err) {
      setMessage({ text: err.response?.data?.error || 'Approval failed', type: 'error' });
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Are you sure you want to reject this loan?')) return;
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await axios.put(`${apiUrl}/admin/loans/${id}/reject`, {}, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setMessage({ text: response.data.message, type: 'success' });
      fetchData();
    } catch (err) {
      setMessage({ text: err.response?.data?.error || 'Rejection failed', type: 'error' });
    }
  };

  if (loading) return <div className="text-center py-20 text-gray-300">Loading admin dashboard...</div>;

  return (
    <div className="space-y-8">
      <div className="glass-panel p-8">
        <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
        <p className="text-gray-400">System overview and administrative actions.</p>
      </div>

      {message.text && (
        <div className={`p-4 rounded ${message.type === 'error' ? 'bg-red-900/50 text-red-200 border border-red-800' : 'bg-green-900/50 text-green-200 border border-green-800'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-panel p-6 border-l-4 border-brand-primary">
          <p className="text-gray-400 text-sm mb-1 uppercase tracking-wide">Total Users</p>
          <p className="text-3xl font-black text-white">{stats.totalUsers}</p>
        </div>
        <div className="glass-panel p-6 border-l-4 border-green-500">
          <p className="text-gray-400 text-sm mb-1 uppercase tracking-wide">Total Platform Funds</p>
          <p className="text-3xl font-black text-white">₹{stats.totalBalances.toFixed(2)}</p>
        </div>
        <div className="glass-panel p-6 border-l-4 border-yellow-500">
          <p className="text-gray-400 text-sm mb-1 uppercase tracking-wide">Pending Loans</p>
          <p className="text-3xl font-black text-white">{stats.pendingLoans}</p>
        </div>
        <div className="glass-panel p-6 border-l-4 border-purple-500">
          <p className="text-gray-400 text-sm mb-1 uppercase tracking-wide">Total Transactions</p>
          <p className="text-3xl font-black text-white">{stats.totalTransactions}</p>
        </div>
      </div>

      <div className="glass-panel p-8">
        <h2 className="text-2xl font-bold text-white mb-6">Pending Loan Approvals</h2>
        
        {loans.length === 0 ? (
          <p className="text-gray-400 italic">No pending loans requiring approval.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-700 text-gray-400 text-sm uppercase">
                  <th className="pb-3 font-semibold">User</th>
                  <th className="pb-3 font-semibold">Type</th>
                  <th className="pb-3 font-semibold">Amount</th>
                  <th className="pb-3 font-semibold">Interest</th>
                  <th className="pb-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="text-white">
                {loans.map(loan => (
                  <tr key={loan.loan_id} className="border-b border-gray-800 hover:bg-gray-800/30 transition-colors">
                    <td className="py-4">
                      <div className="font-bold">{loan.first_name} {loan.last_name}</div>
                      <div className="text-xs text-gray-400">{loan.email} (Cust #{loan.customer_id})</div>
                    </td>
                    <td className="py-4">{loan.loan_type}</td>
                    <td className="py-4 text-brand-accent font-bold">₹{parseFloat(loan.amount).toFixed(2)}</td>
                    <td className="py-4">{parseFloat(loan.interest_rate).toFixed(2)}%</td>
                    <td className="py-4 flex space-x-2">
                      <button 
                        onClick={() => handleApprove(loan.loan_id)}
                        className="bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded text-sm transition-colors"
                      >
                        Approve
                      </button>
                      <button 
                        onClick={() => handleReject(loan.loan_id)}
                        className="bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded text-sm transition-colors"
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
