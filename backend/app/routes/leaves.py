from flask import Blueprint, jsonify, request
from app.models import db, Leave, Doctor
import datetime

leaves_bp = Blueprint('leaves', __name__)

@leaves_bp.route('/api/leaves', methods=['GET'])
def get_leaves():
    leaves = Leave.query.all()
    return jsonify([l.to_dict() for l in leaves])

@leaves_bp.route('/api/leaves', methods=['POST'])
def save_leaves():
    data = request.json
    if not data or 'doctor_id' not in data or 'leave_dates' not in data:
        return jsonify({'error': 'Invalid payload'}), 400
        
    doctor_id = data['doctor_id']
    leave_dates = data['leave_dates']
    
    doctor = Doctor.query.get(doctor_id)
    if not doctor:
        return jsonify({'error': 'Doctor not found'}), 404
        
    try:
        # Parse all dates first to validate them
        parsed_dates = [datetime.datetime.strptime(d, "%Y-%m-%d").date() for d in leave_dates]
    except ValueError:
        return jsonify({'error': 'Invalid date format, use YYYY-MM-DD'}), 400
        
    # Delete existing leaves for this doctor to replace them
    Leave.query.filter_by(doctor_id=doctor_id).delete()
    
    # Save new leaves
    for date_obj in parsed_dates:
        leave = Leave(doctor_id=doctor_id, leave_date=date_obj)
        db.session.add(leave)
        
    db.session.commit()
    
    saved_leaves = Leave.query.filter_by(doctor_id=doctor_id).all()
    return jsonify([l.to_dict() for l in saved_leaves]), 200
