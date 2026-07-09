import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Statements = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const [statements, setStatements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const fetchStatements = async () => {
    setLoading(true);
    setError(null);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const params = new URLSearchParams();
      if (fromDate) params.append('from', fromDate);
      if (toDate) params.append('to', toDate);

      const response = await axios.get(`${apiUrl}/accounts/${id}/statement?${params.toString()}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setStatements(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load statements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchStatements();
  }, [id, user]);

  // Format data for chart
  const chartData = [...statements].reverse().map(stmt => ({
    date: new Date(stmt.transaction_date).toLocaleDateString(),
    balance: parseFloat(stmt.running_balance)
  }));

  return (
    <div className="glass-panel p-8">
      <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
        <h1 className="text-2xl font-bold text-white">Account Statement #{id}</h1>
        <Link to={`/account/${id}`} className="text-brand-accent hover:text-white transition-colors">
          &larr; Back to Account
        </Link>
      </div>

      <div className="flex space-x-4 mb-6">
        <div>
          <label className="block text-sm text-gray-400 mb-1">From Date</label>
          <input 
            type="date" 
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="bg-brand-dark border border-gray-600 rounded px-3 py-2 text-white"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">To Date</label>
          <input 
            type="date" 
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="bg-brand-dark border border-gray-600 rounded px-3 py-2 text-white"
          />
        </div>
        <div className="flex items-end">
          <button 
            onClick={fetchStatements}
            className="bg-brand-secondary hover:bg-gray-700 border border-gray-600 text-white px-4 py-2 rounded transition-colors"
          >
            Filter
          </button>
        </div>
      </div>

      {error ? (
        <div className="p-4 bg-red-900/50 border border-red-800 text-red-300 rounded mb-4">{error}</div>
      ) : loading ? (
        <div className="text-center py-10 text-gray-400">Loading statements...</div>
      ) : (
        <>
          {chartData.length > 0 && (
            <div className="mb-10 bg-brand-dark p-6 rounded-lg border border-gray-700 h-80">
              <h2 className="text-gray-300 mb-4 text-sm uppercase tracking-wider">Balance History</h2>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid stroke="#374151" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" stroke="#9CA3AF" tick={{fill: '#9CA3AF', fontSize: 12}} />
                  <YAxis stroke="#9CA3AF" tick={{fill: '#9CA3AF', fontSize: 12}} domain={['auto', 'auto']} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1E293B', borderColor: '#374151', color: '#fff' }}
                    itemStyle={{ color: '#38bdf8' }}
                  />
                  <Line type="monotone" dataKey="balance" stroke="#38bdf8" strokeWidth={3} dot={{r: 4, fill: '#38bdf8'}} activeDot={{r: 6}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Type</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Amount</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Running Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {statements.map((stmt) => (
                  <tr key={stmt.transaction_id} className="hover:bg-brand-secondary transition-colors">
                    <td className="px-4 py-4 text-sm text-gray-300">
                      {new Date(stmt.transaction_date).toLocaleString()}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-200">{stmt.description}</td>
                    <td className="px-4 py-4 text-sm text-gray-400">{stmt.transaction_type}</td>
                    <td className={`px-4 py-4 text-sm font-medium text-right ${parseFloat(stmt.amount_change) < 0 ? 'text-red-400' : 'text-green-400'}`}>
                      {parseFloat(stmt.amount_change) > 0 ? '+' : ''}{parseFloat(stmt.amount_change).toFixed(2)}
                    </td>
                    <td className="px-4 py-4 text-sm font-bold text-white text-right">
                      ₹{parseFloat(stmt.running_balance).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {statements.length === 0 && !loading && (
              <div className="text-center py-8 text-gray-500">No transactions found for this period.</div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Statements;
