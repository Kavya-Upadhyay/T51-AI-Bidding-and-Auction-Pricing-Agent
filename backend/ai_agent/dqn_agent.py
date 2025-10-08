import torch
import numpy as np
import random
from ai_agent.model import DQN

class DQNAgent:
    def __init__(self, state_size, action_size, model_path=None, epsilon=0.1):
        self.state_size = state_size
        self.action_size = action_size
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.policy_net = DQN(state_size, action_size).to(self.device)
        self.epsilon = epsilon
        self.max_bid = 100

    def act(self, state):
        budgets = state['budgets']
        valuations = state['valuations']
        obs = np.array(budgets + valuations, dtype=np.float32)
        if random.random() < self.epsilon:
            return float(np.random.rand() * self.max_bid)
        with torch.no_grad():
            tensor = torch.tensor(obs, dtype=torch.float32).to(self.device)
            q_vals = self.policy_net(tensor)
            bid_index = torch.argmax(q_vals).item()
            bid = bid_index * (self.max_bid / (self.action_size - 1))
            return float(bid)
