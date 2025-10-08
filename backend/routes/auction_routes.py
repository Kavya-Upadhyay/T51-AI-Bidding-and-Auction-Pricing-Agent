from flask import Blueprint, jsonify, request
from ai_agent.environment import SimpleAuctionEnv
from ai_agent.dqn_agent import DQNAgent

auction_bp = Blueprint('auction_bp', __name__)

env = None
agents = {}

@auction_bp.route('/start', methods=['POST'])
def start_auction():
    global env, agents
    data = request.get_json(force=True)
    num_agents = data.get('num_agents', 3)
    rounds = data.get('rounds', 5)

    env = SimpleAuctionEnv(num_agents=num_agents, rounds=rounds)
    state = env.reset()
    agents = {i: DQNAgent(state_size=2*num_agents, action_size=10) for i in range(num_agents)}
    return jsonify({'state': state})

@auction_bp.route('/bid', methods=['POST'])
def get_bid():
    data = request.get_json(force=True)
    agent_id = data.get('agent_id')
    state = data.get('state')
    if agent_id not in agents:
        return jsonify({'error': 'Invalid agent ID'}), 400
    bid = agents[agent_id].act(state)
    return jsonify({'bid': bid})

@auction_bp.route('/simulate', methods=['POST'])
def simulate():
    global env, agents
    if env is None:
        return jsonify({'error': 'Auction not started'}), 400

    state = env.reset()
    history = []
    done = False

    while not done:
        bids = [agent.act(state) for agent in agents.values()]
        next_state, rewards, done, info = env.step(bids)
        history.append({'bids': bids, 'rewards': rewards, 'info': info})
        state = next_state

    return jsonify({'history': history, 'final_state': state})
