# backend/routes/auction_routes.py
from flask import Blueprint, request, jsonify
from backend.models.dqn_agent import DQNAgent
import numpy as np
import time
import threading
from uuid import uuid4
import torch

auction_bp = Blueprint('auction_bp', __name__)

# ----------------------------
# In-memory stores
# ----------------------------
auctions = {}
user_agents = {}

# Instantiate a single DQNAgent for inference on the server (force CPU)
dqn_agent = DQNAgent(agent_id='dqn1', state_size=4, action_size=10, device=torch.device("cpu"))


# ----------------------------
# Helper Functions
# ----------------------------
def initialize_user_agents(user_id):
    """Initialize default AI agents per user if not already present."""
    if user_id not in user_agents:
        user_agents[user_id] = {
            "alpha": {
                "id": f"alpha_{user_id}",
                "name": "Alpha Bot",
                "budget": 10000,
                "remainingBudget": 10000,
                "totalSpent": 0,
                "isActive": True,
                "strategyType": "reinforcement_learning",
            },
            "beta": {
                "id": f"beta_{user_id}",
                "name": "Beta Bot",
                "budget": 8000,
                "remainingBudget": 8000,
                "totalSpent": 0,
                "isActive": True,
                "strategyType": "heuristic",
            },
            "gamma": {
                "id": f"gamma_{user_id}",
                "name": "Gamma Bot",
                "budget": 15000,
                "remainingBudget": 15000,
                "totalSpent": 0,
                "isActive": True,
                "strategyType": "reinforcement_learning",
            },
        }


# ----------------------------
# Create Auction
# ----------------------------
@auction_bp.route('/create', methods=['POST'])
def create_auction():
    data = request.get_json()
    auction_id = str(uuid4())

    auctions[auction_id] = {
        'id': auction_id,
        'title': data.get('title'),
        'description': data.get('description'),
        'startingPrice': float(data.get('startingPrice', 0)),
        'reservePrice': float(data.get('reservePrice', 0)),
        'increment': float(data.get('increment', 1)),
        'startTime': time.time() * 1000,
        'endTime': time.time() * 1000 + float(data.get('duration', 60)) * 1000,
        'currentPrice': float(data.get('startingPrice', 0)),
        'status': 'pending',
        'participants': [],
        'selectedAgents': {},  # userId → agentId
        'bids': [],
        'winnerId': None,
        'winnerName': None,
        'winnerType': None,
        'winningPrice': None,
    }

    print(f"✅ Auction {auction_id} created.")
    return jsonify({'auction': auctions[auction_id]}), 201


# ----------------------------
# Get Auctions
# ----------------------------
@auction_bp.route('/get-auction', methods=['GET'])
def get_auctions():
    current_time = time.time() * 1000
    for auction in list(auctions.values()):
        if auction['status'] == 'active' and current_time >= auction['endTime']:
            finalize_auction(auction['id'])
    return jsonify({'auctions': list(auctions.values())}), 200


# ----------------------------
# Get User Agents
# ----------------------------
@auction_bp.route('/get-agents/<user_id>', methods=['GET'])
def get_user_agents(user_id):
    initialize_user_agents(user_id)
    return jsonify({'agents': list(user_agents[user_id].values())}), 200


# ----------------------------
# Start Auction
# ----------------------------
@auction_bp.route('/start', methods=['POST'])
def start_auction():
    data = request.get_json()
    auction_id = data.get('auction_id')
    user_id = data.get('user_id')
    selected_agent = data.get('selected_agent')

    if not all([auction_id, user_id, selected_agent]):
        return jsonify({'error': 'Missing parameters'}), 400

    if auction_id not in auctions:
        return jsonify({'error': 'Auction not found'}), 404

    initialize_user_agents(user_id)
    auction = auctions[auction_id]
    auction['selectedAgents'][user_id] = selected_agent
    if user_id not in auction['participants']:
        auction['participants'].append(user_id)

    # If auction was pending, activate it
    if auction['status'] == 'pending':
        auction['status'] = 'active'
        auction['startTime'] = time.time() * 1000
        print(f"🎬 Auction {auction_id} started by {user_id}")

        # Start auto-bidding thread (daemon)
        threading.Thread(target=run_auto_bidding, args=(auction_id,), daemon=True).start()

        # Trigger an initial simulated bid (if desired)
        simulate_single_bid(auction_id)

        # Emit auction_update to interested clients in the room (lazy import to avoid circular import)
        from backend.app import socketio
        socketio.emit('auction_update', {'auction': auction}, room=f'auction_{auction_id}')

    return jsonify({'auction': auction}), 200


# ----------------------------
# Auto Bidding Thread
# ----------------------------
def run_auto_bidding(auction_id):
    """Automatically triggers bidding every few seconds within app context."""
    # Import socketio and flask app lazily to avoid circular import on module load
    from backend.app import socketio, app as flask_app

    with flask_app.app_context():
        # loop only while auction exists and is active
        while auction_id in auctions and auctions[auction_id]['status'] == 'active':
            try:
                # simulate_single_bid will perform the bid and emit
                simulate_single_bid(auction_id)
                time.sleep(4)
            except Exception as e:
                print(f"⚠️ Auto-bidding error: {e}")
                break


# ----------------------------
# Single Bid Simulation Logic
# ----------------------------
def simulate_single_bid(auction_id):
    """Perform one DQN-based bid simulation round and emit results via socketio."""
    if auction_id not in auctions:
        return None
    auction = auctions[auction_id]
    if auction['status'] != 'active':
        return None

    participants = auction['selectedAgents']
    if not participants:
        return None

    highest_bid = auction['currentPrice']
    last_bidder = auction['bids'][-1]['bidderId'] if auction['bids'] else None

    best_agent = None
    best_bid = highest_bid

    for user_id, agent_id in participants.items():
        initialize_user_agents(user_id)
        agents = user_agents[user_id]

        # Find correct agent object by its id
        agent = next((a for a in agents.values() if a['id'] == agent_id), None)
        if not agent:
            print(f"⚠️ Agent not found for user {user_id}: {agent_id}")
            continue

        # skip self-rebidding or insufficient funds
        if agent['id'] == last_bidder or agent['remainingBudget'] <= highest_bid:
            continue

        # if only one participant and initial bid placed → stop
        if len(participants) == 1 and auction['bids']:
            continue

        state = np.array([
            highest_bid,
            auction['increment'],
            agent['remainingBudget'],
            max(0, auction['endTime'] - time.time() * 1000)
        ], dtype=np.float32)

        _, bid_amount = dqn_agent.act(state)
        # Ensure bid respects increment and budget
        bid_amount = max(highest_bid + auction['increment'], min(agent['remainingBudget'], bid_amount))

        if bid_amount > best_bid:
            best_bid = bid_amount
            best_agent = (user_id, agent)

    if best_agent:
        user_id, agent = best_agent
        bid_obj = {
            'id': str(uuid4()),
            'bidderId': agent['id'],
            'bidderName': agent['name'],
            'bidderType': agent['strategyType'],
            'amount': best_bid,
            'timestamp': time.time() * 1000
        }

        # Update auction state
        auction['bids'].append(bid_obj)
        auction['currentPrice'] = best_bid
        print(f"🤖 {agent['name']} placed ${best_bid:.2f}")

        # Emit through socketio lazily (avoid top-level import)
        from backend.app import socketio
        room = f'auction_{auction_id}'

        # Emit a minimal bid_update message (preferred)
        socketio.emit('bid_update', {'auction_id': auction_id, 'bid': bid_obj}, room=room)

        # Also emit full auction_update so frontends that prefer the whole object can sync
        socketio.emit('auction_update', {'auction': auction}, room=room)

        return bid_obj

    return None


# ----------------------------
# Simulate Bid endpoint (manual trigger)
# ----------------------------
@auction_bp.route('/simulate-bid', methods=['POST'])
def simulate_bid_route():
    data = request.get_json() or {}
    auction_id = data.get('auction_id')
    if not auction_id:
        return jsonify({'error': 'Missing auction_id'}), 400

    if auction_id not in auctions:
        return jsonify({'error': 'Auction not found'}), 404

    bid_obj = simulate_single_bid(auction_id)
    if bid_obj:
        return jsonify({'success': True, 'bid': bid_obj, 'auction': auctions[auction_id]}), 200
    else:
        return jsonify({'success': False, 'message': 'No bid was placed'}), 200


# ----------------------------
# Finalize Auction
# ----------------------------
def finalize_auction(auction_id):
    """Marks auction as completed and updates winner budgets."""
    if auction_id not in auctions:
        return
    auction = auctions[auction_id]
    auction['status'] = 'completed'

    if not auction['bids']:
        auction['winnerName'] = 'No Bids'
        auction['winnerType'] = None
        auction['winningPrice'] = 0

        # emit completion to room
        from backend.app import socketio
        socketio.emit('auction_complete', {'auction': auction}, room=f'auction_{auction_id}')
        return

    highest_bid = max(auction['bids'], key=lambda b: b['amount'])
    auction['winnerId'] = highest_bid['bidderId']
    auction['winnerName'] = highest_bid['bidderName']
    auction['winnerType'] = highest_bid.get('bidderType')
    auction['winningPrice'] = highest_bid['amount']

    # Deduct from winning agent
    for user_id, agents in user_agents.items():
        for agent in agents.values():
            if agent['id'] == highest_bid['bidderId']:
                agent['remainingBudget'] -= highest_bid['amount']
                agent['totalSpent'] += highest_bid['amount']

    print(f"🏁 Auction {auction_id} completed. Winner: {auction['winnerName']} (${auction['winningPrice']})")

    from backend.app import socketio
    socketio.emit('auction_complete', {'auction': auction}, room=f'auction_{auction_id}')
