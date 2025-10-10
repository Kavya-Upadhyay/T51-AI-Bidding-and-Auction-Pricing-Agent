import torch
import torch.nn as nn
import torch.optim as optim
import random
import numpy as np
from backend.utils.model_utils import save_model, load_model
from backend.utils.logger import log_training

class DQN(nn.Module):
    def __init__(self, state_size, action_size):
        super(DQN, self).__init__()
        self.layers = nn.Sequential(
            nn.Linear(state_size, 128),
            nn.ReLU(),
            nn.Linear(128, 128),
            nn.ReLU(),
            nn.Linear(128, action_size)
        )
    def forward(self, x):
        return self.layers(x)

class DQNAgent:
    def __init__(
        self,
        agent_id: str,
        state_size: int = 4,
        action_size: int = 10,  # match your backend config
        lr: float = 0.001,
        gamma: float = 0.95,
        epsilon: float = 1.0,
        epsilon_min: float = 0.1,
        epsilon_decay: float = 0.995,
        batch_size: int = 32
    ):
        self.agent_id = agent_id
        self.state_size = state_size
        self.action_size = action_size
        self.gamma = gamma
        self.epsilon = epsilon
        self.epsilon_min = epsilon_min
        self.epsilon_decay = epsilon_decay
        self.batch_size = batch_size
        self.memory = []
        self.model = DQN(state_size, action_size)
        self.optimizer = optim.Adam(self.model.parameters(), lr=lr)
        self.loss_fn = nn.MSELoss()
        load_model(self, f"{agent_id}_pretrained.pth")

    def act(self, state):
        # Returns: action (int), bid_amount (float)
        if np.random.rand() <= self.epsilon:
            action = random.randrange(self.action_size)
        else:
            state_tensor = torch.FloatTensor(state)
            q_values = self.model(state_tensor)
            action = torch.argmax(q_values).item()
        current_price = float(state[0])
        increment = float(state[1])
        bid_amount = current_price + increment * (action + 1)
        return action, bid_amount

    def remember(self, state, action, reward, next_state, done):
        self.memory.append((state, action, reward, next_state, done))
        if len(self.memory) > 5000:
            self.memory.pop(0)

    def replay(self):
        if len(self.memory) < self.batch_size:
            return
        minibatch = random.sample(self.memory, self.batch_size)
        for state, action, reward, next_state, done in minibatch:
            target = reward
            if not done:
                target += self.gamma * torch.max(self.model(torch.FloatTensor(next_state))).item()
            q_values = self.model(torch.FloatTensor(state))
            target_f = q_values.clone().detach()
            target_f[action] = target
            output = self.model(torch.FloatTensor(state))
            loss = self.loss_fn(output[action], torch.tensor(target))
            self.optimizer.zero_grad()
            loss.backward()
            self.optimizer.step()
        if self.epsilon > self.epsilon_min:
            self.epsilon *= self.epsilon_decay

    def train(self, env, episodes=10):
        for e in range(episodes):
            state = env.reset()
            done = False
            total_reward = 0
            while not done:
                action, _ = self.act(state)
                next_state, reward, done = env.step(action)
                self.remember(state, action, reward, next_state, done)
                state = next_state
                total_reward += reward
            self.replay()
            log_training(self.agent_id, e + 1, total_reward)
            save_model(self, f"{self.agent_id}_pretrained.pth")

    def load_pretrained(self, filename="pretrained_agent.pth"):
        load_model(self, filename)
