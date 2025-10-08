from flask import Flask
from backend.routes.auction_routes import auction_bp
from flask_cors import CORS
app = Flask(__name__)
CORS(app)
app.register_blueprint(auction_bp, url_prefix='/api/auction')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
