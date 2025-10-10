// src/components/AuctionRoom.tsx

import React, { useState, useEffect } from 'react';
import { useAuction } from '../hooks/useAuction';
import { useAuth } from '../contexts/AuthContext';
import { Auction, Bid } from '../types/auction.types';
import { X, Clock, Bot, User, DollarSign, Play, AlertCircle } from 'lucide-react';

interface AuctionRoomProps {
  auction: Auction;
  onClose: () => void;
}

export function AuctionRoom({ auction, onClose }: AuctionRoomProps) {
  const { profile } = useAuth();
  const { aiAgents, placeBid, startAuction } = useAuction();
  const [bidAmount, setBidAmount] = useState('');
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isPlacingBid, setIsPlacingBid] = useState(false);

  const isParticipant = profile ? auction.participants.includes(profile.id) : false;
  const userBalance = profile?.balance || 0;
  const minBidAmount = auction.currentPrice + auction.increment;

  // Update time remaining for active auctions
  useEffect(() => {
    if (auction.status === 'active') {
      const interval = setInterval(() => {
        const remaining = Math.max(0, auction.endTime - Date.now());
        setTimeRemaining(remaining);

        // Auto-close if auction ended
        if (remaining === 0) {
          setMessage({ type: 'info', text: 'Auction has ended!' });
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [auction.status, auction.endTime]);

  // Pre-select some AI agents for pending auctions
  useEffect(() => {
    if (auction.status === 'pending' && aiAgents.length > 0) {
      setSelectedAgents(aiAgents.slice(0, Math.min(3, aiAgents.length)).map(a => a.id));
    }
  }, [auction.status, aiAgents]);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const formatTime = (ms: number): string => {
    if (ms <= 0) return '0:00';
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handlePlaceBid = async () => {
    const amount = parseFloat(bidAmount);

    // Validation
    if (isNaN(amount) || amount <= 0) {
      setMessage({ type: 'error', text: 'Please enter a valid amount' });
      return;
    }

    if (amount > userBalance) {
      setMessage({ type: 'error', text: 'Insufficient balance' });
      return;
    }

    if (amount < minBidAmount) {
      setMessage({ type: 'error', text: `Minimum bid is $${minBidAmount.toFixed(2)}` });
      return;
    }

    if (!profile) {
      setMessage({ type: 'error', text: 'Please log in to place a bid' });
      return;
    }

    setIsPlacingBid(true);

    const bid: Bid = {
      id: `bid-${profile.id}-${Date.now()}`,
      auctionId: auction.id,
      bidderId: profile.id,
      bidderType: 'human',
      bidderName: profile.display_name,
      amount,
      timestamp: Date.now()
    };

    try {
      const result = await placeBid(auction.id, bid);
      setMessage({ 
        type: result.success ? 'success' : 'error', 
        text: result.message 
      });

      if (result.success) {
        setBidAmount('');
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to place bid. Please try again.' });
    } finally {
      setIsPlacingBid(false);
    }
  };

  const handleStartAuction = async () => {
    if (selectedAgents.length === 0) {
      setMessage({ type: 'error', text: 'Please select at least one AI agent' });
      return;
    }

    setIsStarting(true);

    try {
      const success = await startAuction(auction.id, selectedAgents);

      if (success) {
        setMessage({ type: 'success', text: 'Auction started successfully!' });
      } else {
        setMessage({ type: 'error', text: 'Failed to start auction' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to start auction. Please try again.' });
    } finally {
      setIsStarting(false);
    }
  };

  const sortedBids = [...auction.bids].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{auction.title}</h2>
            {auction.description && (
              <p className="text-gray-600 mt-1">{auction.description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row max-h-[calc(90vh-80px)]">
          {/* Main Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {/* Auction Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <DollarSign className="w-5 h-5 text-green-600 mr-2" />
                  <div>
                    <div className="text-2xl font-bold text-green-800">
                      ${auction.currentPrice.toFixed(2)}
                    </div>
                    <div className="text-sm text-green-600">Current Price</div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <div className="w-5 h-5 text-blue-600 mr-2" />
                  <div>
                    <div className="text-2xl font-bold text-blue-800">{auction.bids.length}</div>
                    <div className="text-sm text-blue-600">Total Bids</div>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <div className="w-5 h-5 text-purple-600 mr-2" />
                  <div>
                    <div className="text-2xl font-bold text-purple-800">{auction.participants.length}</div>
                    <div className="text-sm text-purple-600">Participants</div>
                  </div>
                </div>
              </div>

              {auction.status === 'active' && (
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <Clock className="w-5 h-5 text-orange-600 mr-2" />
                    <div>
                      <div className={`text-2xl font-bold ${timeRemaining < 30000 ? 'text-red-600' : 'text-orange-800'}`}>
                        {formatTime(timeRemaining)}
                      </div>
                      <div className="text-sm text-orange-600">Time Left</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Message Display */}
            {message && (
              <div className={`mb-4 p-4 rounded-lg flex items-start ${
                message.type === 'success' ? 'bg-green-100 text-green-800' :
                message.type === 'error' ? 'bg-red-100 text-red-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                <AlertCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
                <span>{message.text}</span>
              </div>
            )}

            {/* Pending State - AI Selection */}
            {auction.status === 'pending' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-yellow-800 mb-4">
                  Configure Auction
                </h3>
                <p className="text-yellow-700 mb-4">
                  Select AI agents to participate in this auction, then start when ready.
                </p>

                <div className="space-y-3 mb-4">
                  <h4 className="font-medium text-gray-900">Select AI Competitors:</h4>
                  {aiAgents.length === 0 ? (
                    <p className="text-gray-500">No AI agents available</p>
                  ) : (
                    aiAgents.map(agent => (
                      <label
                        key={agent.id}
                        className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedAgents.includes(agent.id)}
                          onChange={() => {
                            setSelectedAgents(prev =>
                              prev.includes(agent.id)
                                ? prev.filter(id => id !== agent.id)
                                : [...prev, agent.id]
                            );
                          }}
                          className="w-4 h-4 text-blue-600 rounded mr-3"
                        />
                        <Bot className="w-5 h-5 text-blue-600 mr-3" />
                        <div className="flex-1">
                          <div className="font-medium">{agent.name}</div>
                          <div className="text-sm text-gray-600">
                            Budget: ${agent.budget.toLocaleString()} • 
                            Strategy: {agent.strategyType}
                          </div>
                        </div>
                      </label>
                    ))
                  )}
                </div>

                <button
                  onClick={handleStartAuction}
                  disabled={selectedAgents.length === 0 || isStarting}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isStarting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Starting...
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 mr-2" />
                      Start Auction with {selectedAgents.length} AI Agent{selectedAgents.length !== 1 ? 's' : ''}
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Active State - Bidding */}
            {auction.status === 'active' && isParticipant && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-blue-800 mb-4">Place Your Bid</h3>

                <div className="flex gap-3 mb-4">
                  <input
                    type="number"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    placeholder={`Min: $${minBidAmount.toFixed(2)}`}
                    min={minBidAmount}
                    step="0.01"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={handlePlaceBid}
                    disabled={isPlacingBid || !bidAmount || parseFloat(bidAmount) < minBidAmount}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {isPlacingBid ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Placing...
                      </>
                    ) : (
                      'Place Bid'
                    )}
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setBidAmount(minBidAmount.toFixed(2))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                  >
                    Min: ${minBidAmount.toFixed(2)}
                  </button>
                  <button
                    onClick={() => setBidAmount((minBidAmount * 1.5).toFixed(2))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                  >
                    +50%: ${(minBidAmount * 1.5).toFixed(2)}
                  </button>
                  <button
                    onClick={() => setBidAmount((minBidAmount * 2).toFixed(2))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                  >
                    +100%: ${(minBidAmount * 2).toFixed(2)}
                  </button>
                </div>

                <div className="mt-3 text-sm text-gray-600">
                  Your balance: ${userBalance.toFixed(2)}
                </div>
              </div>
            )}

            {/* Completed State */}
            {auction.status === 'completed' && auction.winnerId && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-green-800 mb-2">Auction Completed!</h3>
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-green-700">
                      Winner: <strong>{auction.winnerName}</strong> ({auction.winnerType})
                    </p>
                    <p className="text-green-700">
                      Winning bid: <strong>${auction.winningPrice?.toFixed(2)}</strong>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bid History Sidebar */}
          <div className="w-full lg:w-80 border-l border-gray-200 bg-gray-50">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Bid History</h3>
            </div>
            <div className="p-4 overflow-y-auto max-h-96">
              {sortedBids.length > 0 ? (
                <div className="space-y-3">
                  {sortedBids.map((bid, index) => (
                    <div
                      key={bid.id}
                      className={`p-3 rounded-lg ${
                        index === 0 ? 'bg-yellow-100 border border-yellow-300' : 'bg-white border border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center">
                          {bid.bidderType === 'ai' ? (
                            <Bot className="w-4 h-4 text-blue-600 mr-2" />
                          ) : (
                            <User className="w-4 h-4 text-green-600 mr-2" />
                          )}
                          <span className="font-medium text-sm">{bid.bidderName}</span>
                        </div>
                        <span className="font-bold text-lg">${bid.amount.toFixed(2)}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(bid.timestamp).toLocaleTimeString()}
                        {index === 0 && <span className="text-yellow-600 font-medium ml-2">Leading</span>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No bids yet</p>
                  <p className="text-sm">Be the first to bid!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
