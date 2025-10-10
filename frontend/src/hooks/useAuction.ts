// src/hooks/useAuction.ts
// This is a sample implementation showing how the components should integrate with the backend

import { useState, useEffect, useCallback } from 'react';
import { Auction, Bid, AIAgent } from '../types/auction.types';
import { AuctionEngine } from '../lib/auctionEngine';
import { aiBidder } from '../lib/aibidder';

// Create singleton auction engine instance
const auctionEngine = new AuctionEngine();

export function useAuction() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sample AI agents - in real app, these might come from backend
  const aiAgents: AIAgent[] = [
    {
      id: 'agent-1',
      name: 'Alpha Bot',
      strategyType: 'reinforcement_learning',
      budget: 10000,
      remainingBudget: 10000,
      valuationCap: 15000,
      aggressionLevel: 0.7,
      isActive: true,
      config: { learning_rate: 0.001, epsilon: 0.1 },
      totalSpent: 0,
    },
    {
      id: 'agent-2',
      name: 'Beta Bot',
      strategyType: 'heuristic',
      budget: 8000,
      remainingBudget: 8000,
      valuationCap: 12000,
      aggressionLevel: 0.5,
      isActive: true,
      config: { max_bid_ratio: 0.8, patience_threshold: 5 },
      totalSpent: 0,
    },
    {
      id: 'agent-3',
      name: 'Gamma Bot',
      strategyType: 'reinforcement_learning',
      budget: 15000,
      remainingBudget: 15000,
      valuationCap: 20000,
      aggressionLevel: 0.9,
      isActive: true,
      config: { learning_rate: 0.002, epsilon: 0.05 },
      totalSpent: 0,
    },
  ];

  // Fetch auctions from backend
  const fetchAuctions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const fetchedAuctions = await auctionEngine.fetchAuctions();
      setAuctions(fetchedAuctions);
    } catch (err) {
      setError('Failed to fetch auctions');
      console.error('Error fetching auctions:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create new auction
  const createAuction = useCallback(async (auctionData: Omit<Auction, 'bids' | 'participants'>) => {
    try {
      const success = await auctionEngine.createAuction(auctionData);
      if (success) {
        await fetchAuctions(); // Refresh the list
      }
      return success;
    } catch (err) {
      console.error('Error creating auction:', err);
      return false;
    }
  }, [fetchAuctions]);

  // Start auction with selected AI agents
  const startAuction = useCallback(async (auctionId: string, selectedAgentIds: string[]) => {
    try {
      const selectedAgents = aiAgents.filter(agent => selectedAgentIds.includes(agent.id));

      const success = await auctionEngine.startAuction(auctionId, (updatedAuction) => {
        setAuctions(prev => 
          prev.map(auction => 
            auction.id === updatedAuction.id ? updatedAuction : auction
          )
        );
      });

      if (success) {
        // Start AI bidding
        const auction = auctionEngine.getAuction(auctionId);
        if (auction) {
          aiBidder.startBidding(auction, selectedAgents, (bid) => {
            placeBid(auctionId, bid);
          });
        }
      }

      return success;
    } catch (err) {
      console.error('Error starting auction:', err);
      return false;
    }
  }, []);

  // Place a bid
  const placeBid = useCallback(async (auctionId: string, bid: Bid) => {
    try {
      const result = await auctionEngine.placeBid(auctionId, bid, (updatedAuction) => {
        setAuctions(prev => 
          prev.map(auction => 
            auction.id === updatedAuction.id ? updatedAuction : auction
          )
        );
      });
      return result;
    } catch (err) {
      console.error('Error placing bid:', err);
      return { success: false, message: 'Failed to place bid' };
    }
  }, []);

  // Join auction
  const joinAuction = useCallback((auctionId: string, userId: string) => {
    auctionEngine.joinAuction(auctionId, userId);
    const auction = auctionEngine.getAuction(auctionId);
    if (auction) {
      setAuctions(prev => 
        prev.map(a => a.id === auctionId ? auction : a)
      );
    }
  }, []);

  // Refresh auctions
  const refreshAuctions = useCallback(async () => {
    await fetchAuctions();
  }, [fetchAuctions]);

  // Load auctions on mount
  useEffect(() => {
    fetchAuctions();
  }, [fetchAuctions]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      auctionEngine.cleanup();
      aiBidder.stopAllBidding();
    };
  }, []);

  return {
    auctions,
    loading,
    error,
    aiAgents,
    createAuction,
    startAuction,
    placeBid,
    joinAuction,
    refreshAuctions,
  };
}
