import os
from flask import Flask, request, jsonify, session
from flask_cors import CORS
from app.models import db

def create_app():
    # Set up folders to serve Vite frontend from flask
    frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'frontend', 'dist'))
    app = Flask(__name__,
                static_folder=frontend_dist,
                static_url_path='/',
                template_folder=frontend_dist)
    
    # Configure database: Default to local PostgreSQL database
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-12345')
    
    database_url = os.environ.get('DATABASE_URL', 'postgresql://postgres:admin123@localhost:5432/schedule_db')
    if database_url.startswith('postgres://'):
        database_url = database_url.replace('postgres://', 'postgresql://', 1)
        
    app.config['SQLALCHEMY_DATABASE_URI'] = database_url
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Enable CORS (allow credentials for session management)
    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)
    
    # Initialize database
    db.init_app(app)
    
    # Register Blueprints
    from app.routes.auth import auth_bp
    from app.routes.doctors import doctors_bp
    from app.routes.leaves import leaves_bp
    from app.routes.schedule import schedule_bp
    from app.routes.export import export_bp
    
    app.register_blueprint(auth_bp)
    app.register_blueprint(doctors_bp)
    app.register_blueprint(leaves_bp)
    app.register_blueprint(schedule_bp)
    app.register_blueprint(export_bp)
    
    # Enforce authentication on all API routes except login and register
    @app.before_request
    def require_login():
        if request.path.startswith('/api/'):
            if request.path not in ['/api/login', '/api/register']:
                if 'user_id' not in session:
                    return jsonify({'error': 'Unauthorized'}), 401
    
    # Create tables
    with app.app_context():
        db.create_all()
        
    # Catch-all route to serve React app index.html for client-side routing
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def catch_all(path):
        return app.send_static_file('index.html')
        
    return app

