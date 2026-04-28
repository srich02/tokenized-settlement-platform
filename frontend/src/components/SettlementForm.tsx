import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/auth';
import { submitSettlement, checkCompliance } from '../services/settlement';

export const SettlementForm: React.FC = () => {
  const { user } = useAuthStore();
  const [dealId, setDealId] = useState('');
  const [seller, setSeller] = useState(user?.email || '');
  const [buyer, setBuyer] = useState('');
  const [tokenId, setTokenId] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // First check compliance
      const complianceResult: any = await checkCompliance({
        seller,
        buyer,
        tokenId,
        amount: parseFloat(amount),
      });

      if (!complianceResult.compliant) {
        setError(`Compliance check failed: ${complianceResult.reason}`);
        return;
      }

      // Submit settlement
      const result: any = await submitSettlement({
        dealId,
        seller,
        buyer,
        tokenId,
        amount: parseFloat(amount),
      });

      setSuccess(`Settlement initiated: ${result.transactionId}`);
      // Reset form
      setDealId('');
      setSeller(user?.email || '');
      setBuyer('');
      setTokenId('');
      setAmount('');
    } catch (err: any) {
      setError(err.message || 'Settlement submission failed');
      console.error('Settlement error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2 className="text-2xl font-bold mb-6">Initiate Settlement</h2>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Deal ID</label>
          <input
            type="text"
            value={dealId}
            onChange={(e) => setDealId(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            placeholder="DEAL-001"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Seller Address</label>
          <input
            type="text"
            value={seller}
            onChange={(e) => setSeller(e.target.value)}
            required
            disabled
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Buyer Address</label>
          <input
            type="text"
            value={buyer}
            onChange={(e) => setBuyer(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            placeholder="0x1234..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Token ID</label>
            <input
              type="text"
              value={tokenId}
              onChange={(e) => setTokenId(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              placeholder="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Amount</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              step="0.01"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              placeholder="100.00"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Submitting...' : 'Submit Settlement'}
        </button>
      </form>
    </div>
  );
};
