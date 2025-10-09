import { Auction, AIAgent, Bid } from '../types/auction';

export interface BiddingStrategy {
  decideBid(
    auction: Auction,
    agent: AIAgent,
    currentTime: number
  ): number | null;
}

export class HeuristicStrategy implements BiddingStrategy {
  decideBid(auction: Auction, agent: AIAgent, currentTime: number): number | null {
    if (agent.remainingBudget <= 0) return null;

    const timeRemaining = auction.endTime - currentTime;
    const timeElapsed = currentTime - auction.startTime;
    const totalDuration = auction.endTime - auction.startTime;
    const timeProgress = timeElapsed / totalDuration;

    const estimatedValue = this.estimateItemValue(auction, agent);

    if (estimatedValue > agent.valuationCap) {
      return null;
    }

    switch (auction.format) {
      case 'english':
        return this.decideEnglishBid(auction, agent, timeProgress, estimatedValue);

      case 'dutch':
        return this.decideDutchBid(auction, agent, estimatedValue);

      case 'first_price_sealed':
        return this.decideFirstPriceBid(auction, agent, estimatedValue);

      case 'vickrey':
        return this.decideVickreyBid(auction, agent, estimatedValue);

      default:
        return null;
    }
  }

  private estimateItemValue(auction: Auction, agent: AIAgent): number {
    const baseValue = auction.startingPrice * (1 + Math.random() * 0.5);
    return Math.min(baseValue, agent.valuationCap);
  }

  private decideEnglishBid(
    auction: Auction,
    agent: AIAgent,
    timeProgress: number,
    estimatedValue: number
  ): number | null {
    const minWaitTime = agent.config.min_wait_time || 3;
    const maxBidRatio = agent.config.max_bid_ratio || 0.85;

    if (timeProgress < 0.3 && agent.aggressionLevel < 0.7) {
      if (Math.random() > agent.aggressionLevel) {
        return null;
      }
    }

    const nextBid = auction.currentPrice + auction.increment;
    const maxBid = estimatedValue * maxBidRatio;

    if (nextBid > maxBid || nextBid > agent.remainingBudget) {
      return null;
    }

    if (timeProgress > 0.8) {
      return Math.min(
        estimatedValue * (0.9 + agent.aggressionLevel * 0.1),
        agent.remainingBudget
      );
    }

    return nextBid;
  }

  private decideDutchBid(
    auction: Auction,
    agent: AIAgent,
    estimatedValue: number
  ): number | null {
    const targetPrice = estimatedValue * (1 - agent.aggressionLevel * 0.3);

    if (auction.currentPrice <= targetPrice && auction.currentPrice <= agent.remainingBudget) {
      return auction.currentPrice;
    }

    return null;
  }

  private decideFirstPriceBid(
    auction: Auction,
    agent: AIAgent,
    estimatedValue: number
  ): number | null {
    const existingBid = auction.bids.find(b => b.bidderId === agent.id);
    if (existingBid) return null;

    const shadingFactor = 0.7 + agent.aggressionLevel * 0.25;
    const bidAmount = estimatedValue * shadingFactor;

    if (bidAmount > agent.remainingBudget) {
      return agent.remainingBudget;
    }

    return Math.max(bidAmount, auction.startingPrice);
  }

  private decideVickreyBid(
    auction: Auction,
    agent: AIAgent,
    estimatedValue: number
  ): number | null {
    const existingBid = auction.bids.find(b => b.bidderId === agent.id);
    if (existingBid) return null;

    return Math.min(estimatedValue, agent.remainingBudget);
  }
}

export class ReinforcementLearningStrategy implements BiddingStrategy {
  private qTable: Map<string, Map<string, number>> = new Map();

  decideBid(auction: Auction, agent: AIAgent, currentTime: number): number | null {
    if (agent.remainingBudget <= 0) return null;

    const epsilon = agent.config.epsilon || 0.1;
    const estimatedValue = this.estimateItemValue(auction, agent);

    if (estimatedValue > agent.valuationCap) return null;

    if (Math.random() < epsilon) {
      return this.explore(auction, agent, estimatedValue);
    } else {
      return this.exploit(auction, agent, estimatedValue, currentTime);
    }
  }

  private estimateItemValue(auction: Auction, agent: AIAgent): number {
    const baseValue = auction.startingPrice * (1.2 + Math.random() * 0.3);
    return Math.min(baseValue, agent.valuationCap);
  }

  private explore(auction: Auction, agent: AIAgent, estimatedValue: number): number | null {
    const actions = this.getAvailableActions(auction, agent, estimatedValue);
    if (actions.length === 0) return null;

    return actions[Math.floor(Math.random() * actions.length)];
  }

  private exploit(
    auction: Auction,
    agent: AIAgent,
    estimatedValue: number,
    currentTime: number
  ): number | null {
    const state = this.getState(auction, currentTime);
    const actions = this.getAvailableActions(auction, agent, estimatedValue);

    if (actions.length === 0) return null;

    let bestAction = actions[0];
    let bestValue = this.getQValue(state, bestAction.toString());

    for (const action of actions) {
      const qValue = this.getQValue(state, action.toString());
      if (qValue > bestValue) {
        bestValue = qValue;
        bestAction = action;
      }
    }

    return bestAction;
  }

  private getState(auction: Auction, currentTime: number): string {
    const timeProgress = (currentTime - auction.startTime) / (auction.endTime - auction.startTime);
    const priceLevel = auction.currentPrice / auction.startingPrice;
    const bidCount = auction.bids.length;

    return `${auction.format}_${Math.floor(timeProgress * 10)}_${Math.floor(priceLevel * 10)}_${Math.min(bidCount, 10)}`;
  }

  private getAvailableActions(
    auction: Auction,
    agent: AIAgent,
    estimatedValue: number
  ): number[] {
    const actions: number[] = [];

    switch (auction.format) {
      case 'english':
        const minBid = auction.currentPrice + auction.increment;
        for (let i = 0; i < 5; i++) {
          const bid = minBid + auction.increment * i;
          if (bid <= estimatedValue && bid <= agent.remainingBudget) {
            actions.push(bid);
          }
        }
        break;

      case 'dutch':
        if (auction.currentPrice <= agent.remainingBudget) {
          actions.push(auction.currentPrice);
        }
        break;

      case 'first_price_sealed':
      case 'vickrey':
        const existingBid = auction.bids.find(b => b.bidderId === agent.id);
        if (!existingBid) {
          for (let ratio = 0.6; ratio <= 1.0; ratio += 0.1) {
            const bid = estimatedValue * ratio;
            if (bid >= auction.startingPrice && bid <= agent.remainingBudget) {
              actions.push(bid);
            }
          }
        }
        break;
    }

    return actions;
  }

  private getQValue(state: string, action: string): number {
    if (!this.qTable.has(state)) {
      this.qTable.set(state, new Map());
    }
    return this.qTable.get(state)!.get(action) || 0;
  }

  updateQValue(
    state: string,
    action: string,
    reward: number,
    nextState: string,
    learningRate: number,
    discountFactor: number
  ): void {
    const currentQ = this.getQValue(state, action);

    const nextStateActions = this.qTable.get(nextState);
    const maxNextQ = nextStateActions
      ? Math.max(...Array.from(nextStateActions.values()))
      : 0;

    const newQ = currentQ + learningRate * (reward + discountFactor * maxNextQ - currentQ);

    if (!this.qTable.has(state)) {
      this.qTable.set(state, new Map());
    }
    this.qTable.get(state)!.set(action, newQ);
  }
}

export class BiddingStrategyFactory {
  static createStrategy(strategyType: 'heuristic' | 'reinforcement_learning'): BiddingStrategy {
    switch (strategyType) {
      case 'heuristic':
        return new HeuristicStrategy();
      case 'reinforcement_learning':
        return new ReinforcementLearningStrategy();
      default:
        return new HeuristicStrategy();
    }
  }
}
