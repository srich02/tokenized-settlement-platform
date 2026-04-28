import React, { useEffect, useState } from 'react';
import { listTransactions } from '../services/settlement';

export interface Transaction {
  transactionId: string;
  dealId: string;
  seller: string;
  buyer: string;
  amount: number;
  status: 'INITIATED' | 'PENDING' | 'APPROVED' | 'SETTLED' | 'FAILED';
  timestamp: number;
}

export const TransactionList: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const result: any = await listTransactions();
      setTransactions(result.transactions || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch transactions');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status: Transaction['status']) => {
    const baseClass = 'badge';
    switch (status) {
      case 'SETTLED':
        return `${baseClass} badge-success`;
      case 'APPROVED':
        return `${baseClass} badge-info`;
      case 'PENDING':
      case 'INITIATED':
        return `${baseClass} badge-warning`;
      case 'FAILED':
        return `${baseClass} badge-error`;
      default:
        return baseClass;
    }
  };

  if (loading) return <div className="text-center py-8">Loading transactions...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Transactions</h2>
        <button
          onClick={fetchTransactions}
          className="btn-secondary"
        >
          Refresh
        </button>
      </div>

      {transactions.length === 0 ? (
        <p className="text-gray-500">No transactions yet</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-4">Transaction ID</th>
                <th className="text-left py-2 px-4">Deal ID</th>
                <th className="text-left py-2 px-4">Seller</th>
                <th className="text-left py-2 px-4">Buyer</th>
                <th className="text-right py-2 px-4">Amount</th>
                <th className="text-center py-2 px-4">Status</th>
                <th className="text-left py-2 px-4">Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.transactionId} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-mono text-sm">{tx.transactionId.slice(0, 12)}...</td>
                  <td className="py-3 px-4">{tx.dealId}</td>
                  <td className="py-3 px-4 text-sm">{tx.seller.slice(0, 10)}...</td>
                  <td className="py-3 px-4 text-sm">{tx.buyer.slice(0, 10)}...</td>
                  <td className="py-3 px-4 text-right font-semibold">{tx.amount.toFixed(2)}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={getStatusBadgeClass(tx.status)}>{tx.status}</span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500">
                    {new Date(tx.timestamp).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
