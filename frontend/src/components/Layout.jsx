import React, { useContext } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Layout = () => {
  const location = useLocation();
  const { user, logout } = useContext(AuthContext);

  const isActive = (path) => {
    return location.pathname === path ? 'text-brand-accent font-bold' : 'text-gray-300 hover:text-white transition-colors';
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <nav className="max-w-6xl mx-auto glass-panel mb-8 px-6 py-4 flex justify-between items-center rounded-lg shadow-lg">
        <div className="flex items-center space-x-6">
          <Link to="/" className="text-2xl font-black tracking-tight text-white flex items-center">
            <span className="text-brand-primary mr-1">ACID</span>Bank
          </Link>
          
          <div className="hidden md:flex space-x-4 ml-6 pl-6 border-l border-gray-700">
            <Link to="/" className={isActive('/')}>Dashboard</Link>
            <Link to="/transfer" className={isActive('/transfer')}>Transfer Funds</Link>
            <Link to="/manage-funds" className={isActive('/manage-funds')}>Manage Funds</Link>
            <Link to="/beneficiaries" className={isActive('/beneficiaries')}>Beneficiaries</Link>
            <Link to="/loans" className={isActive('/loans')}>Loans</Link>
            {user?.isAdmin && (
              <Link to="/admin" className={isActive('/admin')}>Admin Panel</Link>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-400">
            Welcome, <span className="font-bold text-white">{user?.firstName}</span>
          </div>
          <button 
            onClick={logout}
            className="text-sm bg-red-900/50 hover:bg-red-800 text-red-200 px-3 py-1.5 rounded transition-colors"
          >
            Logout
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto">
        <Outlet />
      </main>

      <footer className="max-w-6xl mx-auto mt-12 text-center text-sm text-gray-500 pb-8">
        &copy; {new Date().getFullYear()} ACID Bank. All transactions strictly guaranteed.
      </footer>
    </div>
  );
};

export default Layout;
