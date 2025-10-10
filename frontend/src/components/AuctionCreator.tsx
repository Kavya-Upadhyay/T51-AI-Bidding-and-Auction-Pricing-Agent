// src/components/AuctionCreator.tsx
import React, { useState } from 'react';
import { useAuction } from '../hooks/useAuction';
import { Plus, Calendar, DollarSign, TrendingUp, Clock } from 'lucide-react';

export function AuctionCreator() {
  const { createAuction } = useAuction();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startingPrice, setStartingPrice] = useState(100);
  const [reservePrice, setReservePrice] = useState(50);
  const [increment, setIncrement] = useState(10);
  const [duration, setDuration] = useState(60); // Duration in seconds
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    // Validation
    if (!title.trim()) {
      setError('Title is required');
      setLoading(false);
      return;
    }

    if (startingPrice <= 0) {
      setError('Starting price must be greater than 0');
      setLoading(false);
      return;
    }

    if (increment <= 0) {
      setError('Bid increment must be greater than 0');
      setLoading(false);
      return;
    }

    if (duration < 30) {
      setError('Auction duration must be at least 30 seconds');
      setLoading(false);
      return;
    }

    const now = Date.now();
    const auctionData = {
      id: `auction-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: title.trim(),
      description: description.trim(),
      format: 'english' as const,
      startingPrice: Number(startingPrice),
      reservePrice: Number(reservePrice),
      increment: Number(increment),
      startTime: now,
      endTime: now + duration * 1000, // Convert seconds to milliseconds
      currentPrice: Number(startingPrice),
      status: 'pending' as const,
    };

    console.log('Creating auction with data:', auctionData);

    try {
      const success = await createAuction(auctionData);

      if (success) {
        // Reset form
        setTitle('');
        setDescription('');
        setStartingPrice(100);
        setReservePrice(50);
        setIncrement(10);
        setDuration(60);
        setSuccess(true);

        // Hide success message after 3 seconds
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError('Failed to create auction. Please try again.');
      }
    } catch (err) {
      console.error('Error creating auction:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
        <Plus className="w-6 h-6 mr-2" />
        Create New Auction
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          Auction created successfully!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter auction title"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            maxLength={100}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter auction description (optional)"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            maxLength={500}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <DollarSign className="w-4 h-4 inline mr-1" />
              Starting Price *
            </label>
            <input
              type="number"
              value={startingPrice}
              onChange={(e) => setStartingPrice(Number(e.target.value))}
              min="0.01"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reserve Price
            </label>
            <input
              type="number"
              value={reservePrice}
              onChange={(e) => setReservePrice(Number(e.target.value))}
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <TrendingUp className="w-4 h-4 inline mr-1" />
              Bid Increment *
            </label>
            <input
              type="number"
              value={increment}
              onChange={(e) => setIncrement(Number(e.target.value))}
              min="0.01"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="w-4 h-4 inline mr-1" />
              Duration (seconds) *
            </label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              min="30"
              max="3600"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        <div className="text-sm text-gray-600">
          <p>Duration: {Math.floor(duration / 60)}m {duration % 60}s</p>
          <p>Min bid increment: ${increment.toFixed(2)}</p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Creating...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              Create Auction
            </>
          )}
        </button>
      </form>
    </div>
  );
}
