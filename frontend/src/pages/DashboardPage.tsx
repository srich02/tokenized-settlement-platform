import React, { useEffect } from 'react';
import { SettlementForm } from '../components/SettlementForm';
import { TransactionList } from '../components/TransactionList';
import { useAuthStore } from '../store/auth';

export const DashboardPage: React.FC = () => {
  const { getCurrentUser } = useAuthStore();

  useEffect(() => {
    getCurrentUser();
  }, []);

  return (
    <div className="container py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <SettlementForm />
        </div>
        <div>
          <div className="card">
            <h3 className="text-lg font-bold mb-4">Platform Status</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">API Status</p>
                <span className="badge badge-success">Operational</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Network</p>
                <span className="badge badge-info">Connected</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Version</p>
                <span className="text-sm font-mono">1.0.0</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <TransactionList />
    </div>
  );
};
