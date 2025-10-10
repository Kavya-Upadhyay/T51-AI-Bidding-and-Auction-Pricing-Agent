// src/components/AuctionDashboard.tsx
import React, { useEffect, useState } from 'react';
import { useAuction } from '../hooks/useAuction';
import { Auction } from '../types/auction.types';
import { Clock, Users, TrendingUp, DollarSign, RefreshCw, Eye } from 'lucide-react';

interface AuctionDashboardProps {
  onSelectAuction: (auction: Auction) => void;
}

export function AuctionDashboard({ onSelectAuction }: AuctionDashboardProps) {
  const { auctions, loading, refreshAuctions } = useAuction();
  const [timeRemaining, setTimeRemaining] = useState<Record<string, number>>({});

  // Update time remaining for all active auctions
  useEffect(() => {
    const interval = setInterval(() => {
      const newTimeRemaining: Record<string, number> = {};
      auctions.forEach(auction => {
        if (auction.status === 'active') {
          newTimeRemaining[auction.id] = Math.max(0, auction.endTime - Date.now());
        }
      });
      setTimeRemaining(newTimeRemaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [auctions]);

  const formatTimeRemaining = (endTime: number): string => {
    const remaining = Math.max(0, endTime - Date.now());
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);

    if (remaining === 0) return 'Ended';
    if (minutes === 0) return `${seconds}s`;
    return `${minutes}m ${seconds}s`;
  };

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    active: 'bg-green-100 text-green-800 border-green-200',
    completed: 'bg-blue-100 text-blue-800 border-blue-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200',
  };

  const statusLabels = {
    pending: 'Pending',
    active: 'Live',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading auctions...</span>
      </div>
    );
  }

  const sortedAuctions = [...auctions].sort((a, b) => {
    // Sort by status priority: active -> pending -> completed -> cancelled
    const statusPriority = { active: 0, pending: 1, completed: 2, cancelled: 3 };
    const priorityDiff = statusPriority[a.status] - statusPriority[b.status];
    if (priorityDiff !== 0) return priorityDiff;

    // Then by start time (newest first)
    return b.startTime - a.startTime;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          Auction Dashboard ({auctions.length})
        </h2>
        <button
          onClick={refreshAuctions}
          disabled={loading}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {sortedAuctions.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <div className="text-gray-500 mb-2">No auctions found</div>
          <div className="text-sm text-gray-400">Create your first auction to get started</div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sortedAuctions.map((auction) => (
            <div
              key={auction.id}
              className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => onSelectAuction(auction)}
            >
              <div className="p-4">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 truncate flex-1 mr-2">
                    {auction.title}
                  </h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full border ${statusColors[auction.status]}`}>
                    {statusLabels[auction.status]}
                  </span>
                </div>

                {/* Description */}
                {auction.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {auction.description}
                  </p>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="flex items-center text-sm">
                    <DollarSign className="w-4 h-4 text-green-600 mr-1" />
                    <div>
                      <div className="font-medium">${auction.currentPrice.toFixed(2)}</div>
                      <div className="text-xs text-gray-500">Current</div>
                    </div>
                  </div>

                  <div className="flex items-center text-sm">
                    <TrendingUp className="w-4 h-4 text-blue-600 mr-1" />
                    <div>
                      <div className="font-medium">{auction.bids.length}</div>
                      <div className="text-xs text-gray-500">Bids</div>
                    </div>
                  </div>

                  <div className="flex items-center text-sm">
                    <Users className="w-4 h-4 text-purple-600 mr-1" />
                    <div>
                      <div className="font-medium">{auction.participants.length}</div>
                      <div className="text-xs text-gray-500">Participants</div>
                    </div>
                  </div>

                  <div className="flex items-center text-sm">
                    <Clock className="w-4 h-4 text-orange-600 mr-1" />
                    <div>
                      {auction.status === 'active' ? (
                        <>
                          <div className="font-medium text-orange-600">
                            {formatTimeRemaining(auction.endTime)}
                          </div>
                          <div className="text-xs text-gray-500">Remaining</div>
                        </>
                      ) : auction.status === 'pending' ? (
                        <>
                          <div className="font-medium">Ready</div>
                          <div className="text-xs text-gray-500">To Start</div>
                        </>
                      ) : (
                        <>
                          <div className="font-medium">Ended</div>
                          <div className="text-xs text-gray-500">
                            {new Date(auction.endTime).toLocaleDateString()}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <div className="pt-3 border-t border-gray-100">
                  <button className="w-full flex items-center justify-center py-2 px-4 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                    <Eye className="w-4 h-4 mr-2" />
                    {auction.status === 'pending' ? 'Setup & Start' : 
                     auction.status === 'active' ? 'Join Auction' : 'View Results'}
                  </button>
                </div>

                {/* Winner info for completed auctions */}
                {auction.status === 'completed' && auction.winnerId && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="text-sm">
                      <span className="text-gray-500">Winner: </span>
                      <span className="font-medium text-gray-900">
                        {auction.winnerName}
                      </span>
                      <span className="text-green-600 ml-2">
                        ${auction.winningPrice?.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
