import React from 'react';
import { Auction, AuctionFormat } from '../types/auction';
import { Clock, Users, TrendingUp, DollarSign } from 'lucide-react';

interface AuctionListProps {
  auctions: Auction[];
  onSelectAuction: (auction: Auction) => void;
}

const formatTypeLabels: Record<AuctionFormat, string> = {
  english: 'English (Ascending)',
  dutch: 'Dutch (Descending)',
  first_price_sealed: 'First-Price Sealed',
  vickrey: 'Vickrey (Second-Price)',
};

const statusColors = {
  pending: 'bg-gray-100 text-gray-800 border-gray-300',
  active: 'bg-green-100 text-green-800 border-green-300',
  completed: 'bg-blue-100 text-blue-800 border-blue-300',
  cancelled: 'bg-red-100 text-red-800 border-red-300',
};

export function AuctionList({ auctions, onSelectAuction }: AuctionListProps) {
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatTimeRemaining = (endTime: number) => {
    const remaining = Math.max(0, endTime - Date.now());
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {auctions.map(auction => (
        <div
          key={auction.id}
          onClick={() => onSelectAuction(auction)}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all cursor-pointer hover:border-blue-300"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {auction.title}
              </h3>
              <p className="text-sm text-gray-600 line-clamp-2">
                {auction.description}
              </p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium border ${
                statusColors[auction.status]
              }`}
            >
              {auction.status}
            </span>
          </div>

          <div className="space-y-3 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Format</span>
              <span className="font-medium text-gray-900">
                {formatTypeLabels[auction.format]}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center text-gray-500">
                <DollarSign className="w-4 h-4 mr-1" />
                Current Price
              </div>
              <span className="font-semibold text-blue-600">
                ${auction.currentPrice.toFixed(2)}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center text-gray-500">
                <Users className="w-4 h-4 mr-1" />
                Participants
              </div>
              <span className="font-medium text-gray-700">
                {auction.participants.size}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center text-gray-500">
                <TrendingUp className="w-4 h-4 mr-1" />
                Total Bids
              </div>
              <span className="font-medium text-gray-700">
                {auction.bids.length}
              </span>
            </div>

            {auction.status === 'active' && (
              <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-100">
                <div className="flex items-center text-gray-500">
                  <Clock className="w-4 h-4 mr-1" />
                  Time Left
                </div>
                <span className="font-medium text-orange-600">
                  {formatTimeRemaining(auction.endTime)}
                </span>
              </div>
            )}

            {auction.status === 'completed' && auction.winnerId && (
              <div className="pt-2 border-t border-gray-100">
                <div className="text-sm text-gray-500 mb-1">Winner</div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">
                    {auction.winnerName}
                  </span>
                  <span className="font-semibold text-green-600">
                    ${auction.winningPrice?.toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-gray-100">
            <button className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
              {auction.status === 'active' ? 'Join Auction' : 'View Details'}
            </button>
          </div>
        </div>
      ))}

      {auctions.length === 0 && (
        <div className="col-span-full text-center py-12">
          <p className="text-gray-500">No auctions available. Create one to get started!</p>
        </div>
      )}
    </div>
  );
}
