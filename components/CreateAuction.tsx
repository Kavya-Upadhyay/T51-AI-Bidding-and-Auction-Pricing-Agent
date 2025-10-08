import React, { useState } from 'react';
import { AuctionFormat } from '../types/auction';
import { X } from 'lucide-react';

interface CreateAuctionProps {
  onClose: () => void;
  onCreate: (auction: any) => void;
}

export function CreateAuction({ onClose, onCreate }: CreateAuctionProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [format, setFormat] = useState<AuctionFormat>('english');
  const [startingPrice, setStartingPrice] = useState('10');
  const [reservePrice, setReservePrice] = useState('');
  const [increment, setIncrement] = useState('1');
  const [duration, setDuration] = useState('5');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const now = Date.now();
    const durationMs = parseInt(duration) * 60 * 1000;

    onCreate({
      title,
      description,
      format,
      startingPrice: parseFloat(startingPrice),
      reservePrice: reservePrice ? parseFloat(reservePrice) : undefined,
      currentPrice: format === 'dutch' ? parseFloat(startingPrice) : parseFloat(startingPrice),
      increment: parseFloat(increment),
      status: 'pending',
      startTime: now,
      endTime: now + durationMs,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Create New Auction</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Auction Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Vintage Watch"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              required
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe the item being auctioned..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Auction Format
            </label>
            <select
              value={format}
              onChange={e => setFormat(e.target.value as AuctionFormat)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="english">English (Ascending) - Price increases with each bid</option>
              <option value="dutch">Dutch (Descending) - Price decreases until someone buys</option>
              <option value="first_price_sealed">First-Price Sealed - Highest bid wins, pays bid amount</option>
              <option value="vickrey">Vickrey (Second-Price) - Highest bid wins, pays second-highest</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Starting Price ($)
              </label>
              <input
                type="number"
                required
                min="0.01"
                step="0.01"
                value={startingPrice}
                onChange={e => setStartingPrice(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reserve Price ($) <span className="text-gray-400">(Optional)</span>
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={reservePrice}
                onChange={e => setReservePrice(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bid Increment ($)
              </label>
              <input
                type="number"
                required
                min="0.01"
                step="0.01"
                value={increment}
                onChange={e => setIncrement(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration (minutes)
              </label>
              <input
                type="number"
                required
                min="1"
                step="1"
                value={duration}
                onChange={e => setDuration(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Create Auction
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
