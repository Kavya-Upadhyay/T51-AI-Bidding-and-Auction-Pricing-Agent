from flask import Blueprint, request, jsonify
from backend.models.dqn_agent import DQNAgent
from backend.models.auction_env import AuctionEnvironment

auction_bp = Blueprint('auction_bp', __name__)

# Initialize global auction environment and agents
env = AuctionEnvironment()
agents = {
    'agent_1': DQNAgent(agent_id='agent_1'),
    'agent_2': DQNAgent(agent_id='agent_2')
}

# Store current auction state
current_auction = None

@auction_bp.route('/create', methods=['POST'])
def create_auction():
    global current_auction
    data = request.get_json()

    # Basic English auction setup
    current_auction = {
        'id': data.get('id'),
        'status': 'pending',
        'startingPrice': data.get('startingPrice', 0),
        'currentPrice': data.get('startingPrice', 0),
        'increment': data.get('increment', 10),
        'bids': [],
        'participants': [],
        'winnerId': None,
        'winnerName': None,
        'winningPrice': None
    }

    return jsonify({'message': 'Auction created successfully', 'auction': current_auction}), 201


@auction_bp.route('/get-auction', methods=['GET'])
def get_auction():
    if not current_auction:
        return jsonify({'error': 'No active auction'}), 404
    return jsonify({'state': current_auction})


@auction_bp.route('/place-bid', methods=['POST'])
def place_bid():
    global current_auction
    if not current_auction:
        return jsonify({'error': 'No active auction'}), 404

    data = request.get_json()
    agent_id = data.get('agent_id')
    bid_amount = float(data.get('bid_amount', 0))
    current_price = current_auction['currentPrice']
    increment = current_auction['increment']

    # Validate bid
    if bid_amount < current_price + increment:
        return jsonify({'error': f'Bid must be at least {current_price + increment}'}), 400

    # Accept bid
    bid = {
        'bidderId': agent_id,
        'amount': bid_amount
    }
    current_auction['bids'].append(bid)
    current_auction['currentPrice'] = bid_amount

    return jsonify({'message': 'Bid accepted', 'new_price': bid_amount})


@auction_bp.route('/reset-env', methods=['GET'])
def reset_env():
    global current_auction
    current_auction = None
    env.reset()
    return jsonify({'message': 'Environment reset successfully'})
