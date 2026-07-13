import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const JointAccounts = () => {
    const { user } = useContext(AuthContext);
    const [accounts, setAccounts] = useState([]);
    const [jointAccounts, setJointAccounts] = useState([]);
    const [email, setEmail] = useState('');
    const [selectedAccount, setSelectedAccount] = useState('');
    const [message, setMessage] = useState({ text: '', type: '' });

    const fetchData = async () => {
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            // Fetch my accounts to populate dropdown
            const meRes = await axios.get(`${apiUrl}/me`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            // Only allow sharing accounts that I actually own (not joint ones where I'm just a guest)
            setAccounts(meRes.data.accounts.filter(a => !a.is_joint));
            
            // Fetch who has access to my accounts
            const jointRes = await axios.get(`${apiUrl}/joint-accounts`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setJointAccounts(jointRes.data);
            
            if (meRes.data.accounts.length > 0 && !selectedAccount) {
                setSelectedAccount(meRes.data.accounts.filter(a => !a.is_joint)[0]?.account_id || '');
            }
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        if (user) fetchData();
    }, [user]);

    const handleAddUser = async (e) => {
        e.preventDefault();
        setMessage({ text: '', type: '' });
        
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            await axios.post(`${apiUrl}/joint-accounts`, 
                { email, accountId: selectedAccount },
                { headers: { Authorization: `Bearer ${user.token}` } }
            );
            setMessage({ text: 'User successfully added to account!', type: 'success' });
            setEmail('');
            fetchData();
        } catch (err) {
            setMessage({ text: err.response?.data?.error || 'Failed to add user', type: 'error' });
        }
    };

    const handleRemoveUser = async (jointId) => {
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            await axios.delete(`${apiUrl}/joint-accounts/${jointId}`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            fetchData();
        } catch (err) {
            alert('Failed to remove joint owner');
        }
    };

    return (
        <div className="space-y-8">
            <div className="glass-panel p-8">
                <h1 className="text-3xl font-bold text-white mb-2">Joint Accounts</h1>
                <p className="text-gray-400">Share access to your accounts with family or partners.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="glass-panel p-8">
                    <h2 className="text-xl font-bold text-white mb-6">Add a Joint Owner</h2>
                    {message.text && (
                        <div className={`p-4 rounded mb-6 text-sm ${message.type === 'error' ? 'bg-red-900/50 text-red-200 border border-red-800' : 'bg-green-900/50 text-green-200 border border-green-800'}`}>
                            {message.text}
                        </div>
                    )}
                    
                    <form onSubmit={handleAddUser} className="space-y-4">
                        <div>
                            <label className="block text-gray-400 text-sm font-bold mb-2">User's Email</label>
                            <input 
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-gray-900 text-white border border-gray-700 rounded p-3 focus:outline-none focus:border-brand-primary transition-colors"
                                placeholder="partner@example.com"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-gray-400 text-sm font-bold mb-2">Select Account to Share</label>
                            <select 
                                value={selectedAccount}
                                onChange={(e) => setSelectedAccount(e.target.value)}
                                className="w-full bg-gray-900 text-white border border-gray-700 rounded p-3 focus:outline-none focus:border-brand-primary transition-colors"
                                required
                            >
                                {accounts.map(acc => (
                                    <option key={acc.account_id} value={acc.account_id}>
                                        {acc.account_type} - Acc #{acc.account_id} (Bal: ₹{parseFloat(acc.balance).toFixed(2)})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <button 
                            type="submit"
                            className="w-full bg-brand-primary hover:bg-brand-accent text-white font-bold py-3 px-4 rounded transition-colors"
                        >
                            Invite as Joint Owner
                        </button>
                    </form>
                </div>

                <div className="glass-panel p-8">
                    <h2 className="text-xl font-bold text-white mb-6">Users With Access</h2>
                    
                    {jointAccounts.length === 0 ? (
                        <div className="text-center py-10">
                            <p className="text-gray-400">You haven't shared your accounts with anyone.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {jointAccounts.map(ja => (
                                <div key={ja.joint_id} className="bg-gray-800/50 p-4 rounded border border-gray-700 flex justify-between items-center">
                                    <div>
                                        <p className="font-bold text-white">{ja.user_email}</p>
                                        <p className="text-sm text-gray-400">Access to: {ja.account_type} #{ja.account_id}</p>
                                    </div>
                                    <button 
                                        onClick={() => handleRemoveUser(ja.joint_id)}
                                        className="text-red-400 hover:text-red-300 text-sm font-bold transition-colors"
                                    >
                                        Revoke
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

export default JointAccounts;
