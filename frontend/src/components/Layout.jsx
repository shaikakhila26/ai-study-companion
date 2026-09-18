import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="font-semibold text-brand-700 text-lg">
              AI Study Companion
            </Link>
            <nav className="hidden sm:flex items-center gap-4 text-sm text-slate-600">
              <Link to="/" className="hover:text-brand-700">Home</Link>
              <Link to="/spaces" className="hover:text-brand-700">Spaces</Link>
              <Link to="/analytics" className="hover:text-brand-700">Analytics</Link>
              {user?.role === 'admin' && (
                <Link to="/admin" className="hover:text-brand-700">Admin</Link>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500 hidden sm:inline">{user?.name}</span>
            <button
              className="btn-secondary text-sm"
              onClick={() => {
                logout();
                navigate('/login');
              }}
            >
              Log out
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
