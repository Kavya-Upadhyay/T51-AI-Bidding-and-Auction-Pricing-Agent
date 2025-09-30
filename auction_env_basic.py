import random

class SimpleAuctionEnv:
    """
    A very simplified auction environment.
    - One agent (our AI bidder) vs. one heuristic opponent.
    - Actions: 0 = WAIT, 1 = BID.
    - State: current_price, time_left.
    """

    def __init__(self, start_price=10, min_increment=5, valuation=100, max_time=5):
        self.start_price = start_price
        self.min_increment = min_increment
        self.valuation = valuation
        self.max_time = max_time
        self.reset()

    def reset(self):
        self.current_price = self.start_price
        self.time_left = self.max_time
        self.highest = None  # 'agent' or 'opponent'
        return self._get_state()

    def _get_state(self):
        return {
            "price": self.current_price,
            "time_left": self.time_left,
            "highest": self.highest
        }

    def step(self, action):
        """Takes an action: 0 = WAIT, 1 = BID."""
        if self.time_left <= 0:
            raise RuntimeError("Auction has already ended. Call reset().")

        # Agent action
        if action == 1:
            self.current_price += self.min_increment
            self.highest = "agent"

        # Opponent heuristic (bids randomly if price < valuation)
        if self.current_price < self.valuation and random.random() < 0.5:
            self.current_price += self.min_increment
            self.highest = "opponent"

        # Reduce time
        self.time_left -= 1

        # Check if auction ended
        done = self.time_left == 0
        reward = 0
        if done:
            if self.highest == "agent":
                reward = self.valuation - self.current_price  # surplus if agent wins
            else:
                reward = 0  # no reward if lost

        return self._get_state(), reward, done

# -------------------------------
# Example run (simulation loop)
# -------------------------------
if __name__ == "__main__":
    env = SimpleAuctionEnv()
    state = env.reset()

    total_reward = 0
    while True:
        # Random agent: choose BID or WAIT
        action = random.choice([0, 1])
        state, reward, done = env.step(action)
        print(f"Action: {action}, State: {state}, Reward: {reward}")

        total_reward += reward
        if done:
            print("Auction ended. Total reward:", total_reward)
            break
