from flask import Blueprint, request, jsonify
from backend.models.dqn_agent import DQNAgent
from backend.models.auction_env import AuctionEnvironment
import numpy as np

auction_bp = Blueprint('auction_bp', __name__)

# In-memory data stores (replace with database in production)
auctions = {}
agents = {}

# DQN agent instance for AI bidding
dqn_agent = DQNAgent(agent_id='1', state_size=4, action_size=10)  # match your config
# load_model(dqn_agent)  # load pretrained model if exists


# ----------------------------
# Create Auction
# ----------------------------
@auction_bp.route('/create', methods=['POST'])
def create_auction():
    data = request.get_json()
    auction_id = data.get('id')

    # Store auction in memory with default values as needed
    auctions[auction_id] = {
        'id': auction_id,
        'title': data.get('title'),
        'description': data.get('description'),
        'format': data.get('format', 'english'),
        'startingPrice': data.get('startingPrice'),
        'reservePrice': data.get('reservePrice'),
        'increment': data.get('increment'),
        'startTime': data.get('startTime'),
        'endTime': data.get('endTime'),
        'currentPrice': data.get('currentPrice'),
        'status': data.get('status', 'pending'),
        'bids': data.get('bids', []),
        'participants': data.get('participants', []),
    }
    print(f"✅ Auction created: {auction_id}")
    return jsonify({'auction': auctions[auction_id]}), 201


# ----------------------------
# Get All Auctions
# ----------------------------
@auction_bp.route('/get-auction', methods=['GET'])
def get_all_auctions():
    print(f"📦 Returning {len(auctions)} auctions")
    return jsonify({'auctions': list(auctions.values())}), 200


# ----------------------------
# Place Bid (Human)
# ----------------------------
@auction_bp.route('/place-bid', methods=['POST'])
def place_bid():
    data = request.json
    auction_id = data.get('auction_id')
    bidder_id = data.get('bidder_id')
    amount = float(data.get('amount', 0))

    if auction_id not in auctions:
        return jsonify({'error': 'Auction not found'}), 404

    auction = auctions[auction_id]
    current_price = auction.get('currentPrice', 0)
    increment = auction.get('increment', 1)

    if amount < current_price + increment:
        return jsonify({'error': 'Bid too low'}), 400

    auction.setdefault('bids', []).append({
        'bidderId': bidder_id,
        'amount': amount
    })
    auction['currentPrice'] = amount
    auctions[auction_id] = auction

    return jsonify({'message': 'Bid placed successfully', 'auction': auction}), 200


# ----------------------------
# AI Bid Route
# ----------------------------
@auction_bp.route('/ai-bid', methods=['POST'])
def ai_bid():
    data = request.json
    agent_id = data.get('agent_id')
    auction_state = data.get('auction_state')

    if not auction_state:
        return jsonify({'error': 'Missing auction state'}), 400

    state = np.array([
        auction_state.get('current_price', 0),
        auction_state.get('increment', 1),
        auction_state.get('remaining_budget', 0),
        auction_state.get('time_left', 0)
    ], dtype=np.float32)

    action, bid_amount = dqn_agent.act(state)
    print(f"[AI Agent {agent_id}] RL bid: {bid_amount}")

    return jsonify({'agent_id': agent_id, 'bid_amount': float(bid_amount)}), 200


# ----------------------------
# Start Auction
# ----------------------------
@auction_bp.route('/start', methods=['POST'])
def start_auction():
    data = request.get_json()
    auction_id = data.get('auction_id')

    if auction_id not in auctions:
        return jsonify({'error': 'Auction not found'}), 404

    auction = auctions[auction_id]
    auction['status'] = 'active'
    print(f"🔁 Auction {auction_id} started.")

    return jsonify({'message': f'Auction {auction_id} started successfully'}), 200
