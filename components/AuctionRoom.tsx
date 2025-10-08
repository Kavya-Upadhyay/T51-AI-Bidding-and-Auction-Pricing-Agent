import React, { useState, useEffect } from 'react';
import { Auction, Bid, AIAgent, AuctionFormat } from '../types/auction';
import { X, Clock, Users, TrendingUp, AlertCircle, Bot, User } from 'lucide-react';

interface AuctionRoomProps {
  auction: Auction;
  aiAgents: AIAgent[];
  currentUserId: string;
  userBalance: number;
  onClose: () => void;
  onPlaceBid: (amount: number) => { success: boolean; message: string };
  onStartAuction: (participatingAgents: string[]) => void;
  onJoinAuction: () => void;
}

const formatLabels: Record<AuctionFormat, string> = {
  english: 'English Auction',
  dutch: 'Dutch Auction',
  first_price_sealed: 'First-Price Sealed Bid',
  vickrey: 'Vickrey Auction',
};

export function AuctionRoom({
  auction,
  aiAgents,
  currentUserId,
  userBalance,
  onClose,
  onPlaceBid,
  onStartAuction,
  onJoinAuction,
}: AuctionRoomProps) {
  const [bidAmount, setBidAmount] = useState('');
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const isParticipant = auction.participants.has(currentUserId);
  const isSealed = auction.format === 'first_price_sealed' || auction.format === 'vickrey';
  const userHasBid = auction.bids.some(b => b.bidderId === currentUserId);

  useEffect(() => {
    if (auction.status === 'active') {
      const interval = setInterval(() => {
        setTimeRemaining(Math.max(0, auction.endTime - Date.now()));
      }, 100);
      return () => clearInterval(interval);
    }
  }, [auction.status, auction.endTime]);

  useEffect(() => {
    if (auction.status === 'pending') {
      setSelectedAgents(aiAgents.slice(0, 3).map(a => a.id));
    }
  }, [auction.status]);

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const deciseconds = Math.floor((ms % 1000) / 100);
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${deciseconds}`;
  };

  const handlePlaceBid = () => {
    const amount = parseFloat(bidAmount);
    if (isNaN(amount)) {
      setMessage({ type: 'error', text: 'Please enter a valid amount' });
      return;
    }

    if (amount > userBalance) {
      setMessage({ type: 'error', text: 'Insufficient balance' });
      return;
    }

    const result = onPlaceBid(amount);
    setMessage({ type: result.success ? 'success' : 'error', text: result.message });

    if (result.success) {
      setBidAmount('');
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleStartAuction = () => {
    if (!isParticipant) {
      onJoinAuction();
    }
    onStartAuction(selectedAgents);
  };

  const handleJoin = () => {
    onJoinAuction();
    setMessage({ type: 'success', text: 'Joined auction!' });
    setTimeout(() => setMessage(null), 2000);
  };

  const toggleAgent = (agentId: string) => {
    setSelectedAgents(prev =>
      prev.includes(agentId) ? prev.filter(id => id !== agentId) : [...prev, agentId]
    );
  };

  const sortedBids = [...auction.bids].sort((a, b) => b.timestamp - a.timestamp);
  const visibleBids = isSealed && auction.status === 'active' ? [] : sortedBids;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{auction.title}</h2>
            <p className="text-sm text-gray-600 mt-1">{formatLabels[auction.format]}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm text-gray-500">Your Balance</div>
              <div className="text-lg font-semibold text-gray-900">${userBalance.toFixed(2)}</div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Current Price</div>
                    <div className="text-3xl font-bold text-blue-600">
                      ${auction.currentPrice.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Status</div>
                    <div className="text-xl font-semibold capitalize text-gray-900">
                      {auction.status}
                    </div>
                  </div>
                </div>

                {auction.status === 'active' && (
                  <div className="flex items-center gap-2 text-orange-600 mb-4">
                    <Clock className="w-5 h-5" />
                    <span className="text-lg font-semibold">
                      {formatTime(timeRemaining)}
                    </span>
                  </div>
                )}

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Starting Price</span>
                    <span className="font-medium">${auction.startingPrice.toFixed(2)}</span>
                  </div>
                  {auction.reservePrice && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Reserve Price</span>
                      <span className="font-medium">${auction.reservePrice.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Bid Increment</span>
                    <span className="font-medium">${auction.increment.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total Bids</span>
                    <span className="font-medium">{auction.bids.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Participants</span>
                    <span className="font-medium">{auction.participants.size}</span>
                  </div>
                </div>
              </div>

              {auction.status === 'pending' && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Select AI Competitors
                  </h3>
                  <div className="space-y-3 mb-4">
                    {aiAgents.map(agent => (
                      <label
                        key={agent.id}
                        className="flex items-center gap-3 p-3 bg-white rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedAgents.includes(agent.id)}
                          onChange={() => toggleAgent(agent.id)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <Bot className="w-5 h-5 text-gray-400" />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{agent.name}</div>
                          <div className="text-xs text-gray-500">
                            {agent.strategyType} • Budget: ${agent.budget} • Aggression: {(agent.aggressionLevel * 100).toFixed(0)}%
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                  <div className="space-y-3">
                    {!isParticipant && (
                      <button
                        onClick={handleJoin}
                        className="w-full py-3 px-6 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                      >
                        Join Auction
                      </button>
                    )}
                    <button
                      onClick={handleStartAuction}
                      disabled={selectedAgents.length === 0}
                      className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      Start Auction with {selectedAgents.length} AI Agent{selectedAgents.length !== 1 ? 's' : ''}
                    </button>
                  </div>
                </div>
              )}

              {auction.status === 'active' && isParticipant && (
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Place Your Bid</h3>

                  {isSealed && userHasBid ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                      <div className="text-green-800 font-medium">Your bid has been submitted</div>
                      <div className="text-sm text-green-600 mt-1">
                        Results will be revealed when the auction ends
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex gap-3 mb-3">
                        <input
                          type="number"
                          step="0.01"
                          value={bidAmount}
                          onChange={e => setBidAmount(e.target.value)}
                          placeholder={`Min: $${(auction.currentPrice + auction.increment).toFixed(2)}`}
                          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button
                          onClick={handlePlaceBid}
                          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                        >
                          {auction.format === 'dutch' ? 'Buy Now' : 'Place Bid'}
                        </button>
                      </div>

                      {auction.format === 'english' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => setBidAmount((auction.currentPrice + auction.increment).toFixed(2))}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                          >
                            Min Bid: ${(auction.currentPrice + auction.increment).toFixed(2)}
                          </button>
                          <button
                            onClick={() => setBidAmount((auction.currentPrice + auction.increment * 5).toFixed(2))}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                          >
                            +5x: ${(auction.currentPrice + auction.increment * 5).toFixed(2)}
                          </button>
                        </div>
                      )}
                    </>
                  )}

                  {message && (
                    <div className={`mt-3 p-3 rounded-lg text-sm ${
                      message.type === 'success'
                        ? 'bg-green-50 text-green-800 border border-green-200'
                        : 'bg-red-50 text-red-800 border border-red-200'
                    }`}>
                      {message.text}
                    </div>
                  )}
                </div>
              )}

              {auction.status === 'completed' && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Auction Completed</h3>
                  {auction.winnerId ? (
                    <div>
                      <div className="text-gray-600 mb-2">Winner</div>
                      <div className="flex items-center gap-3 mb-3">
                        {auction.winnerType === 'ai' ? (
                          <Bot className="w-6 h-6 text-blue-500" />
                        ) : (
                          <User className="w-6 h-6 text-green-500" />
                        )}
                        <span className="text-2xl font-bold text-gray-900">
                          {auction.winnerName}
                        </span>
                      </div>
                      <div className="text-gray-600 mb-1">Winning Price</div>
                      <div className="text-3xl font-bold text-green-600">
                        ${auction.winningPrice?.toFixed(2)}
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-600">No winner - reserve price not met</div>
                  )}
                </div>
              )}
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  {isSealed && auction.status === 'active' ? 'Bid History (Hidden)' : 'Bid History'}
                </h3>

                {isSealed && auction.status === 'active' ? (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">
                      Bids are sealed and will be revealed when the auction ends
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      {auction.bids.length} bid{auction.bids.length !== 1 ? 's' : ''} submitted
                    </p>
                  </div>
                ) : visibleBids.length > 0 ? (
                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {visibleBids.map((bid, index) => (
                      <div
                        key={bid.id}
                        className={`p-3 rounded-lg border ${
                          index === 0 && auction.status === 'active'
                            ? 'bg-blue-50 border-blue-200'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            {bid.bidderType === 'ai' ? (
                              <Bot className="w-4 h-4 text-blue-500" />
                            ) : (
                              <User className="w-4 h-4 text-green-500" />
                            )}
                            <span className="font-medium text-sm text-gray-900">
                              {bid.bidderName}
                            </span>
                          </div>
                          <span className="font-bold text-blue-600">
                            ${bid.amount.toFixed(2)}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(bid.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-sm text-gray-500">
                    No bids yet
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
