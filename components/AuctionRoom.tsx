// src/components/AuctionRoom.tsx
import React, { useState, useEffect } from 'react';
import socket from '../lib/socket';

import { useAuction } from '../hooks/useAuction';
import { Auction } from '../types/auction.types';
import { Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface AuctionRoomProps {
  auction: Auction;
  onClose?: () => void;
}

export function AuctionRoom({ auction: initialAuction, onClose }: AuctionRoomProps) {
  const { aiAgents, startAuction, refreshAuctions, simulateBid } = useAuction();
  const { user } = useAuth();

  const [auction, setAuction] = useState<Auction>(initialAuction);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [isWorking, setIsWorking] = useState(false);
  const [joined, setJoined] = useState(false);
  const [started, setStarted] = useState(initialAuction.status === 'active');

  // If parent passes a new auction prop (rare), keep local state in sync
  useEffect(() => {
    setAuction(initialAuction);
    setStarted(initialAuction.status === 'active');
  }, [initialAuction]);

  // Join socket room and listen for live updates for this auction
  useEffect(() => {
    if (!auction?.id) return;

    // Join the auction-specific room on the server
    socket.emit('join_auction', { auction_id: auction.id });

    // Handler for bid_update (preferred minimal payload)
    const handleBidUpdate = (payload: {
      auction_id?: string;
      bid?: any;
      auction?: Auction;
    }) => {
      if (!payload) return;
      const id = payload.auction_id || payload.auction?.id;
      if (id !== auction.id) return;

      // If backend sent full auction
      if (payload.auction) {
        setAuction({ ...payload.auction });
        return;
      }

      // If backend sent only a bid
      if (payload.bid) {
        setAuction((prev) => {
          const next = { ...prev };

          // update current price if provided
          if (payload.bid.amount !== undefined && payload.bid.amount !== null) {
            next.currentPrice = payload.bid.amount;
          }

          // append bid into bids array, ensure not to mutate original
          const existing = Array.isArray(next.bids) ? [...next.bids] : [];
          // avoid duplicates by id (if bid has id)
          if (payload.bid.id && existing.some((b) => b.bidderId === payload.bid.id)) {
            return next;
          }
          existing.push(payload.bid);
          next.bids = existing;
          return next;
        });
      }
    };

    // Handler for full auction updates / completion
    const handleAuctionUpdate = (payload: { auction: Auction }) => {
      if (!payload?.auction) return;
      if (payload.auction.id === auction.id) {
        setAuction({ ...payload.auction });
      }
    };

    socket.on('bid_update', handleBidUpdate);
    socket.on('auction_update', handleAuctionUpdate);
    socket.on('auction_complete', handleAuctionUpdate);

    return () => {
      // leave room and clean listeners on unmount / auction change
      socket.emit('leave_auction', { auction_id: auction.id });
      socket.off('bid_update', handleBidUpdate);
      socket.off('auction_update', handleAuctionUpdate);
      socket.off('auction_complete', handleAuctionUpdate);
    };
    // We intentionally depend on auction.id so we re-join if auction changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auction.id]);

  // Keep joined/started status in sync with auction state + user
  useEffect(() => {
    setJoined(!!(auction.participants && user && auction.participants.includes(user.id)));
    setStarted(auction.status === 'active');
  }, [auction, user]);

  const formatRemainingTime = (endTime: number) => {
    const remaining = Math.max(0, endTime - Date.now());
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    if (remaining <= 0) return 'Ended';
    if (minutes === 0) return `${seconds}s`;
    return `${minutes}m ${seconds}s`;
  };

  // Start Auction
  const handleStartAuction = async () => {
    if (!user) return alert('You must be logged in to start the auction.');
    if (!selectedAgentId) return alert('Please select an AI agent.');

    setIsWorking(true);
    try {
      await startAuction(auction.id, [selectedAgentId]);
      setStarted(true);
      setJoined(true);
      await refreshAuctions();
    } catch (err) {
      console.error(err);
      alert('Failed to start auction.');
    } finally {
      setIsWorking(false);
    }
  };

  // Join Active Auction
  const handleJoinAuction = async () => {
    if (!user) return alert('You must be logged in to join.');
    if (!selectedAgentId) return alert('Select an AI agent first.');

    setIsWorking(true);
    try {
      await startAuction(auction.id, [selectedAgentId]);
      setJoined(true);
      await refreshAuctions();
    } catch (err) {
      console.error(err);
      alert('Failed to join auction.');
    } finally {
      setIsWorking(false);
    }
  };

  // Manually trigger one simulation round (debug)
  const handleManualSimulate = async () => {
    setIsWorking(true);
    try {
      await simulateBid(auction.id);
      await refreshAuctions();
    } catch (err) {
      console.error(err);
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-6 bg-white rounded-lg shadow-lg p-6 border border-gray-200">
      {/* LEFT PANEL */}
      <div>
        <h2 className="text-2xl font-bold mb-1">{auction.title}</h2>
        <p className="text-gray-600 mb-3">{auction.description}</p>

        {/* Auction stats */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="bg-green-100 p-2 rounded-lg text-center">
            <div className="text-lg font-bold text-green-800">
              ${auction.currentPrice?.toFixed(2)}
            </div>
            <div className="text-xs text-green-700">Current Price</div>
          </div>

          <div className="bg-blue-100 p-2 rounded-lg text-center">
            <div className="text-lg font-bold text-blue-800">{auction.bids?.length || 0}</div>
            <div className="text-xs text-blue-700">Total Bids</div>
          </div>

          <div className="bg-purple-100 p-2 rounded-lg text-center">
            <div className="text-lg font-bold text-purple-800">
              {auction.participants?.length || 0}
            </div>
            <div className="text-xs text-purple-700">Participants</div>
          </div>

          <div className="bg-red-100 p-2 rounded-lg text-center">
            <div className="text-lg font-bold text-red-800 flex items-center justify-center">
              <Clock className="w-4 h-4 mr-1" />
              {formatRemainingTime(auction.endTime)}
            </div>
            <div className="text-xs text-red-700">Time Left</div>
          </div>
        </div>

        {/* COMPLETED AUCTION */}
        {auction.status === 'completed' && (
          <div className="bg-blue-50 border border-blue-300 p-4 rounded-lg text-center mb-4">
            🏁 <span className="font-semibold">Auction Completed!</span>
            <div className="mt-2">
              Winner:{' '}
              <span className="font-bold text-green-700">
                {auction.winnerName || 'No Winner'}
              </span>{' '}
              ({auction.winnerType || 'N/A'}) —{' '}
              <span className="text-green-600">${auction.winningPrice ?? '0.00'}</span>
            </div>
          </div>
        )}

        {/* START CONTROLS */}
        {auction.status === 'pending' && !started && (
          <div className="bg-yellow-50 border border-yellow-300 p-3 rounded mb-4">
            <h4 className="font-semibold mb-2">Select AI Agent to Start Auction:</h4>

            {aiAgents.map((agent) => (
              <label
                key={agent.id}
                className="flex items-center space-x-3 p-2 border rounded-lg hover:border-blue-500 cursor-pointer mb-2"
              >
                <input
                  type="radio"
                  name="agent-start"
                  value={agent.id}
                  checked={selectedAgentId === agent.id}
                  onChange={() => setSelectedAgentId(agent.id)}
                />
                <div>
                  <div className="font-medium">{agent.name}</div>
                  <div className="text-sm text-gray-500">
                    Budget: ${agent.budget.toLocaleString()} • {agent.strategyType}
                  </div>
                </div>
              </label>
            ))}

            <button
              onClick={handleStartAuction}
              disabled={isWorking}
              className="mt-3 w-full py-2 rounded text-white font-semibold bg-blue-600 hover:bg-blue-700"
            >
              {isWorking ? 'Starting…' : 'Start Auction'}
            </button>
          </div>
        )}

        {/* JOIN CONTROLS */}
        {auction.status === 'active' && !joined && (
          <div className="bg-yellow-50 border border-yellow-300 p-3 rounded mb-4">
            <h4 className="font-semibold mb-2">Join this Active Auction:</h4>

            {aiAgents.map((agent) => (
              <label
                key={agent.id}
                className="flex items-center space-x-3 p-2 border rounded-lg hover:border-green-500 cursor-pointer mb-2"
              >
                <input
                  type="radio"
                  name="agent-join"
                  value={agent.id}
                  checked={selectedAgentId === agent.id}
                  onChange={() => setSelectedAgentId(agent.id)}
                />
                <div>
                  <div className="font-medium">{agent.name}</div>
                  <div className="text-sm text-gray-500">
                    Budget: ${agent.budget.toLocaleString()} • {agent.strategyType}
                  </div>
                </div>
              </label>
            ))}

            <button
              onClick={handleJoinAuction}
              disabled={isWorking}
              className="mt-3 w-full py-2 rounded text-white font-semibold bg-green-600 hover:bg-green-700"
            >
              {isWorking ? 'Joining…' : 'Join Auction'}
            </button>
          </div>
        )}

        {/* JOINED MESSAGE */}
        {auction.status === 'active' && joined && (
          <div className="bg-green-50 border border-green-300 text-green-700 p-3 rounded mb-4">
            ✅ You have joined this auction with your selected agent.
          </div>
        )}

        {/* DEBUG MANUAL SIMULATE */}
        {auction.status === 'active' && (
          <button
            onClick={handleManualSimulate}
            disabled={isWorking}
            className="mt-2 w-full py-2 border border-indigo-600 text-indigo-600 rounded hover:bg-indigo-50"
          >
            Simulate Bid (Manual)
          </button>
        )}
      </div>

      {/* RIGHT PANEL — BID HISTORY */}
      <div>
        <h4 className="font-semibold text-gray-800 mb-3">Bid History</h4>
        <div className="bg-gray-50 rounded-lg shadow-inner h-96 overflow-y-auto p-3 space-y-2 border">
          {auction.bids && auction.bids.length > 0 ? (
            [...auction.bids].reverse().map((bid, idx) => (
              <div
                key={idx}
                className={`p-2 rounded-lg ${
                  idx === 0 ? 'bg-yellow-100 border border-yellow-400' : 'bg-white'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-800">
                    🤖 {bid.bidderName} ({bid.bidderType || 'AI'})
                  </span>
                  <span className="font-bold">${bid.amount}</span>
                </div>
                <div className="text-xs text-gray-600">
                  {new Date(bid.timestamp).toLocaleTimeString()} {idx === 0 && '• Leading'}
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-sm text-center">No bids yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
