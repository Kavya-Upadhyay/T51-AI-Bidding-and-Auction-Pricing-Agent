import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Auction, AIAgent, HumanParticipant, Bid } from '../types/auction';
import { AuctionEngine } from '../lib/auctionEngine';
import { AIBidder } from '../lib/aiBidder';

interface AuctionContextType {
  auctions: Auction[];
  aiAgents: AIAgent[];
  currentUser: HumanParticipant;
  createAuction: (auction: Omit<Auction, 'id' | 'bids' | 'participants'>) => void;
  startAuction: (auctionId: string, participatingAgents: string[]) => void;
  placeBid: (auctionId: string, amount: number) => { success: boolean; message: string };
  joinAuction: (auctionId: string) => void;
  updateUserBalance: (amount: number) => void;
}

const AuctionContext = createContext<AuctionContextType | undefined>(undefined);

const engine = new AuctionEngine();
const aiBidder = new AIBidder();

const defaultAgents: AIAgent[] = [
  {
    id: 'agent-1',
    name: 'Conservative Carl',
    strategyType: 'heuristic',
    budget: 500,
    remainingBudget: 500,
    valuationCap: 100,
    aggressionLevel: 0.3,
    isActive: true,
    config: { min_wait_time: 5, max_bid_ratio: 0.8 },
    totalSpent: 0,
  },
  {
    id: 'agent-2',
    name: 'Aggressive Alice',
    strategyType: 'heuristic',
    budget: 1000,
    remainingBudget: 1000,
    valuationCap: 300,
    aggressionLevel: 0.9,
    isActive: true,
    config: { min_wait_time: 1, max_bid_ratio: 0.95 },
    totalSpent: 0,
  },
  {
    id: 'agent-3',
    name: 'Balanced Bob',
    strategyType: 'heuristic',
    budget: 750,
    remainingBudget: 750,
    valuationCap: 200,
    aggressionLevel: 0.5,
    isActive: true,
    config: { min_wait_time: 3, max_bid_ratio: 0.85 },
    totalSpent: 0,
  },
  {
    id: 'agent-4',
    name: 'RL Explorer',
    strategyType: 'reinforcement_learning',
    budget: 800,
    remainingBudget: 800,
    valuationCap: 250,
    aggressionLevel: 0.6,
    isActive: true,
    config: { epsilon: 0.2, learning_rate: 0.01, discount_factor: 0.95 },
    totalSpent: 0,
  },
  {
    id: 'agent-5',
    name: 'RL Exploiter',
    strategyType: 'reinforcement_learning',
    budget: 1200,
    remainingBudget: 1200,
    valuationCap: 400,
    aggressionLevel: 0.8,
    isActive: true,
    config: { epsilon: 0.1, learning_rate: 0.005, discount_factor: 0.99 },
    totalSpent: 0,
  },
];

export function AuctionProvider({ children }: { children: ReactNode }) {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [aiAgents, setAiAgents] = useState<AIAgent[]>(defaultAgents);
  const [currentUser] = useState<HumanParticipant>({
    id: 'user-1',
    name: 'You',
    balance: 1500,
  });

  useEffect(() => {
    return () => {
      engine.cleanup();
      aiBidder.cleanup();
    };
  }, []);

  const updateAuction = (auction: Auction) => {
    setAuctions(prev => {
      const index = prev.findIndex(a => a.id === auction.id);
      if (index >= 0) {
        const newAuctions = [...prev];
        newAuctions[index] = auction;
        return newAuctions;
      }
      return prev;
    });
  };

  const createAuction = (auctionData: Omit<Auction, 'id' | 'bids' | 'participants'>) => {
    const auction: Auction = {
      ...auctionData,
      id: `auction-${Date.now()}`,
      bids: [],
      participants: new Set(),
    };

    engine.createAuction(auction);
    setAuctions(prev => [...prev, auction]);
  };

  const startAuction = (auctionId: string, participatingAgentIds: string[]) => {
    const participatingAgents = aiAgents.filter(agent =>
      participatingAgentIds.includes(agent.id)
    );

    engine.startAuction(auctionId, updateAuction);

    participatingAgents.forEach(agent => {
      engine.joinAuction(auctionId, agent.id);
    });

    const auction = engine.getAuction(auctionId);
    if (auction) {
      updateAuction(auction);
    }

    aiBidder.startBidding(
      engine.getAuction(auctionId)!,
      participatingAgents,
      (bid: Bid) => {
        const result = engine.placeBid(auctionId, bid, updateAuction);

        if (result.success) {
          const agent = aiAgents.find(a => a.id === bid.bidderId);
          if (agent) {
            agent.remainingBudget -= bid.amount;

            const auction = engine.getAuction(auctionId);
            if (auction?.status === 'completed' && auction.winnerId === agent.id) {
              const refund = bid.amount - (auction.winningPrice || bid.amount);
              agent.remainingBudget += refund;
              agent.totalSpent += auction.winningPrice || 0;
            }

            setAiAgents([...aiAgents]);
          }
        }
      }
    );
  };

  const placeBid = (auctionId: string, amount: number): { success: boolean; message: string } => {
    const bid: Bid = {
      id: `bid-${Date.now()}`,
      auctionId,
      bidderId: currentUser.id,
      bidderType: 'human',
      bidderName: currentUser.name,
      amount,
      isAutoBid: false,
      timestamp: Date.now(),
    };

    const result = engine.placeBid(auctionId, bid, updateAuction);

    if (result.success) {
      const auction = engine.getAuction(auctionId);
      if (auction?.status === 'completed' && auction.winnerId === currentUser.id) {
        currentUser.balance -= auction.winningPrice || amount;
      }
    }

    return result;
  };

  const joinAuction = (auctionId: string) => {
    engine.joinAuction(auctionId, currentUser.id);
    const auction = engine.getAuction(auctionId);
    if (auction) {
      updateAuction(auction);
    }
  };

  const updateUserBalance = (amount: number) => {
    currentUser.balance += amount;
  };

  return (
    <AuctionContext.Provider
      value={{
        auctions,
        aiAgents,
        currentUser,
        createAuction,
        startAuction,
        placeBid,
        joinAuction,
        updateUserBalance,
      }}
    >
      {children}
    </AuctionContext.Provider>
  );
}

export function useAuction() {
  const context = useContext(AuctionContext);
  if (!context) {
    throw new Error('useAuction must be used within AuctionProvider');
  }
  return context;
}
