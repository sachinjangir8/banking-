import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import AccountDetails from './components/AccountDetails';
import TransferFunds from './components/TransferFunds';
import Statements from './components/Statements';
import Login from './components/Login';
import Register from './components/Register';
import ManageFunds from './components/ManageFunds';
import JointAccounts from './components/JointAccounts';
import Loans from './components/Loans';
import AdminDashboard from './components/AdminDashboard';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div className="text-center p-10 text-white">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div className="text-center p-10 text-white">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.isAdmin) return <Navigate to="/" replace />;
  return children;
};

const NotFound = () => (
  <div className="glass-panel p-8 text-center">
    <h1 className="text-3xl font-bold text-red-400 mb-2">404</h1>
    <p className="text-gray-300">Page Not Found</p>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="account/:id" element={<AccountDetails />} />
            <Route path="account/:id/statements" element={<Statements />} />
            <Route path="transfer" element={<TransferFunds />} />
            <Route path="manage-funds" element={<ManageFunds />} />
            <Route path="joint-accounts" element={<JointAccounts />} />
            <Route path="loans" element={<Loans />} />
            <Route path="admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
