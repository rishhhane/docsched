from flask import Blueprint, jsonify, request
from app.models import db, Doctor

doctors_bp = Blueprint('doctors', __name__)

@doctors_bp.route('/api/doctors', methods=['GET'])
def get_doctors():
    doctors = Doctor.query.all()
    return jsonify([d.to_dict() for d in doctors])

@doctors_bp.route('/api/doctors', methods=['POST'])
def add_doctor():
    data = request.json
    if not data or 'name' not in data or 'priority' not in data:
        return jsonify({'error': 'Invalid payload'}), 400
        
    priority = int(data['priority'])
    if priority not in [1, 2, 3]:
        return jsonify({'error': 'Priority must be 1, 2, or 3'}), 400
        
    doctor = Doctor(name=data['name'], priority=priority)
    db.session.add(doctor)
    db.session.commit()
    return jsonify(doctor.to_dict()), 201

@doctors_bp.route('/api/doctors/<int:id>', methods=['DELETE'])
def delete_doctor(id):
    doctor = Doctor.query.get(id)
    if not doctor:
        return jsonify({'error': 'Doctor not found'}), 404
        
    db.session.delete(doctor)
    db.session.commit()
    return jsonify({'message': 'Doctor deleted successfully'}), 200
