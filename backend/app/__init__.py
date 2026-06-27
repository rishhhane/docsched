import os
from flask import Flask
from flask_cors import CORS
from app.models import db

def create_app():
    # Set up folders to serve Vite frontend from flask
    frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'frontend', 'dist'))
    app = Flask(__name__,
                static_folder=frontend_dist,
                static_url_path='/',
                template_folder=frontend_dist)
    
    # Configure database: Default to local SQLite file
    db_path = os.path.join(app.root_path, '..', 'scheduler.db')
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', f'sqlite:///{os.path.abspath(db_path)}')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Enable CORS
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    
    # Initialize database
    db.init_app(app)
    
    # Register Blueprints
    from app.routes.doctors import doctors_bp
    from app.routes.leaves import leaves_bp
    from app.routes.schedule import schedule_bp
    from app.routes.export import export_bp
    
    app.register_blueprint(doctors_bp)
    app.register_blueprint(leaves_bp)
    app.register_blueprint(schedule_bp)
    app.register_blueprint(export_bp)
    
    # Create tables
    with app.app_context():
        db.create_all()
        
    # Catch-all route to serve React app index.html for client-side routing
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def catch_all(path):
        return app.send_static_file('index.html')
        
    return app
