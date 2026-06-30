from flask import Blueprint, jsonify, request, session
from app.models import db, User, Doctor

auth_bp = Blueprint('auth', __name__)

def seed_user_doctors(user_id):
    seed_doctors = [
        # Priority 1
        Doctor(name="Aiko", priority=1, user_id=user_id),
        Doctor(name="Manjunath", priority=1, user_id=user_id),
        Doctor(name="Mareena", priority=1, user_id=user_id),
        Doctor(name="Ravikiran", priority=1, user_id=user_id),
        Doctor(name="Sainath", priority=1, user_id=user_id),
        Doctor(name="Srivas", priority=1, user_id=user_id),
        # Priority 2
        Doctor(name="Amita", priority=2, user_id=user_id),
        Doctor(name="Anup", priority=2, user_id=user_id),
        Doctor(name="Arjun", priority=2, user_id=user_id),
        Doctor(name="Ashith", priority=2, user_id=user_id),
        Doctor(name="Pavan", priority=2, user_id=user_id),
        Doctor(name="Ramesh", priority=2, user_id=user_id),
        Doctor(name="Sinju", priority=2, user_id=user_id),
        # Priority 3
        Doctor(name="Arun", priority=3, user_id=user_id),
        Doctor(name="Parvathy", priority=3, user_id=user_id),
        Doctor(name="Shrish", priority=3, user_id=user_id),
        Doctor(name="Siddarth", priority=3, user_id=user_id),
        Doctor(name="Varun", priority=3, user_id=user_id),
        Doctor(name="Vinay", priority=3, user_id=user_id),
        Doctor(name="Vishal", priority=3, user_id=user_id),
    ]
    db.session.bulk_save_objects(seed_doctors)
    db.session.commit()

@auth_bp.route('/api/register', methods=['POST'])
def register():
    data = request.json or {}
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()
    
    if not username or not password:
        return jsonify({'error': 'Username and password are required'}), 400
        
    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters long'}), 400
        
    existing_user = User.query.filter_by(username=username).first()
    if existing_user:
        return jsonify({'error': 'Username already exists'}), 400
        
    user = User(username=username)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    
    # Auto-seed new user with default sample doctors
    seed_user_doctors(user.id)
    
    session['user_id'] = user.id
    return jsonify(user.to_dict()), 201

@auth_bp.route('/api/login', methods=['POST'])
def login():
    data = request.json or {}
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()
    
    if not username or not password:
        return jsonify({'error': 'Username and password are required'}), 400
        
    user = User.query.filter_by(username=username).first()
    if not user or not user.check_password(password):
        return jsonify({'error': 'Invalid username or password'}), 401
        
    session['user_id'] = user.id
    return jsonify(user.to_dict()), 200

@auth_bp.route('/api/logout', methods=['POST'])
def logout():
    session.pop('user_id', None)
    return jsonify({'message': 'Logged out successfully'}), 200

@auth_bp.route('/api/me', methods=['GET'])
def me():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
        
    user = User.query.get(session['user_id'])
    if not user:
        session.pop('user_id', None)
        return jsonify({'error': 'User not found'}), 401
        
    return jsonify(user.to_dict()), 200
