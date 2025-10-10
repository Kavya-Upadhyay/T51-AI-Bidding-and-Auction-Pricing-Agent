// src/types/auction.types.ts

export type AuctionFormat = 'english' | 'dutch' | 'first_price_sealed' | 'vickrey';

export type AuctionStatus = 'pending' | 'active' | 'completed' | 'cancelled';

export type BidderType = 'human' | 'ai';

export type StrategyType = 'heuristic' | 'reinforcement_learning';

export interface Auction {
  id: string;
  title: string;
  description: string;
  format: AuctionFormat;
  startingPrice: number;
  reservePrice: number;
  increment: number;
  startTime: number;
  endTime: number;
  currentPrice: number;
  status: AuctionStatus;
  winnerId?: string;
  winnerName?: string;
  winnerType?: BidderType;
  winningPrice?: number;
  bids: Bid[];
  participants: string[]; // Changed from Set<string> to string[] to match backend
}

export interface Bid {
  id: string;
  auctionId: string;
  bidderId: string;
  bidderName: string;
  bidderType: BidderType;
  amount: number;
  timestamp: number;
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

export interface Profile {
  id: string;
  display_name: string;
  avatar_url?: string;
  balance: number;
  created_at: string;
  updated_at: string;
}

export interface AuthContextType {
  user: any | null;
  profile: Profile | null;
  session: any | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: any }>;
}

// Backend API response types
export interface BackendAuctionResponse {
  auction?: Auction;
  auctions?: Auction[];
  message?: string;
  error?: string;
}

export interface BackendBidResponse {
  message?: string;
  auction?: Auction;
  error?: string;
}

export interface BackendAIBidResponse {
  agent_id: string;
  bid_amount: number;
  error?: string;
}
