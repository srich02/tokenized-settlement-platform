import React from 'react';
import { useAuthStore } from '../store/auth';

export const Header: React.FC = () => {
  const { user, isAuthenticated, signOut } = useAuthStore();

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <header className="bg-white shadow">
      <div className="container py-4 flex justify-between items-center">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold text-blue-600">💳 Settlement Platform</h1>
        </div>

        {isAuthenticated && user && (
          <div className="flex items-center gap-6">
            <div className="text-sm">
              <p className="text-gray-500">Logged in as</p>
              <p className="font-semibold">{user.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="btn-secondary"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
