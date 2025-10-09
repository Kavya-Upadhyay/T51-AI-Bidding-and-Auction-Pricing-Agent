import { Auction, AIAgent, Bid } from '../types/auction';
import { BiddingStrategyFactory, BiddingStrategy } from './aiStrategies';

export class AIBidder {
  private strategies: Map<string, BiddingStrategy> = new Map();
  private bidTimers: Map<string, NodeJS.Timeout> = new Map();

  registerAgent(agent: AIAgent): void {
    if (!this.strategies.has(agent.id)) {
      const strategy = BiddingStrategyFactory.createStrategy(agent.strategyType);
      this.strategies.set(agent.id, strategy);
    }
  }

  startBidding(
    auction: Auction,
    agents: AIAgent[],
    onBid: (bid: Bid) => void
  ): void {
    agents.forEach(agent => {
      if (!agent.isActive) return;

      this.registerAgent(agent);
      this.scheduleBid(auction, agent, onBid);
    });
  }

  private scheduleBid(
    auction: Auction,
    agent: AIAgent,
    onBid: (bid: Bid) => void
  ): void {
    if (auction.status !== 'active') return;

    const strategy = this.strategies.get(agent.id);
    if (!strategy) return;

    const delay = this.calculateDelay(auction, agent);

    const timer = setTimeout(() => {
      this.attemptBid(auction, agent, strategy, onBid);

      if (auction.status === 'active' && auction.format !== 'first_price_sealed' && auction.format !== 'vickrey') {
        this.scheduleBid(auction, agent, onBid);
      }
    }, delay);

    const key = `${auction.id}-${agent.id}`;
    this.bidTimers.set(key, timer);
  }

  private calculateDelay(auction: Auction, agent: AIAgent): number {
    const baseDelay = 1000;
    const aggressionMultiplier = 2 - agent.aggressionLevel;

    switch (auction.format) {
      case 'english':
        return baseDelay * aggressionMultiplier + Math.random() * 2000;

      case 'dutch':
        return baseDelay * aggressionMultiplier * 0.5;

      case 'first_price_sealed':
      case 'vickrey':
        const timeRemaining = auction.endTime - Date.now();
        return Math.random() * Math.min(timeRemaining * 0.8, 10000);

      default:
        return baseDelay;
    }
  }

  private attemptBid(
    auction: Auction,
    agent: AIAgent,
    strategy: BiddingStrategy,
    onBid: (bid: Bid) => void
  ): void {
    if (auction.status !== 'active' || !agent.isActive || agent.remainingBudget <= 0) {
      return;
    }

    const currentTime = Date.now();
    const bidAmount = strategy.decideBid(auction, agent, currentTime);

    if (bidAmount !== null && bidAmount <= agent.remainingBudget) {
      const bid: Bid = {
        id: `${agent.id}-${Date.now()}`,
        auctionId: auction.id,
        bidderId: agent.id,
        bidderType: 'ai',
        bidderName: agent.name,
        amount: bidAmount,
        isAutoBid: true,
        timestamp: currentTime,
      };

      onBid(bid);
    }
  }

  stopBidding(auctionId: string, agentId?: string): void {
    if (agentId) {
      const key = `${auctionId}-${agentId}`;
      const timer = this.bidTimers.get(key);
      if (timer) {
        clearTimeout(timer);
        this.bidTimers.delete(key);
      }
    } else {
      this.bidTimers.forEach((timer, key) => {
        if (key.startsWith(auctionId)) {
          clearTimeout(timer);
          this.bidTimers.delete(key);
        }
      });
    }
  }

  cleanup(): void {
    this.bidTimers.forEach(timer => clearTimeout(timer));
    this.bidTimers.clear();
  }
}
