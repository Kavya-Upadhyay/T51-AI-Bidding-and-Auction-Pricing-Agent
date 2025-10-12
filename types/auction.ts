export type AuctionFormat = 'english' | 'dutch' | 'first_price_sealed' | 'vickrey';
export type AuctionStatus = 'pending' | 'active' | 'completed' | 'cancelled';
export type BidderType = 'human' | 'ai';
export type StrategyType = 'heuristic' | 'reinforcement_learning';

export interface Bid {
  id: string;
  auctionId: string;
  bidderId: string;
  bidderType: BidderType;
  bidderName: string;
  amount: number;
  isAutoBid: boolean;
  timestamp: number;
}

export interface Auction {
  id: string;
  title: string;
  description: string;
  format: AuctionFormat;
  startingPrice: number;
  reservePrice?: number;
  currentPrice: number;
  increment: number;
  status: AuctionStatus;
  startTime: number;
  endTime: number;
  winnerId?: string;
  winnerType?: BidderType;
  winnerName?: string;
  winningPrice?: number;
  bids: Bid[];
  participants: Set<string>;
}

export interface AIAgent {
  id: string;
  name: string;
  strategyType: StrategyType;
  budget: number;
  remainingBudget: number;
  valuationCap: number;
  aggressionLevel: number;
  isActive: boolean;
  config: Record<string, any>;
  totalSpent: number;
}

export interface HumanParticipant {
  id: string;
  name: string;
  balance: number;
}
