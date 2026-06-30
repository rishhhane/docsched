from flask import Blueprint, jsonify, request, session
from app.models import db, Schedule, Doctor, Leave, ScheduleMeta
from app.scheduler.algorithm import generate_schedule as run_scheduler
import datetime
import calendar

schedule_bp = Blueprint('schedule', __name__)

@schedule_bp.route('/api/schedule', methods=['GET'])
def get_schedule():
    month = request.args.get('month', type=int)
    year = request.args.get('year', type=int)
    
    if not month or not year:
        now = datetime.datetime.now()
        month = month or now.month
        year = year or now.year
        
    start_date = datetime.date(year, month, 1)
    last_day = calendar.monthrange(year, month)[1]
    end_date = datetime.date(year, month, last_day)
    
    schedules = Schedule.query.filter(
        Schedule.date >= start_date, 
        Schedule.date <= end_date,
        Schedule.user_id == session['user_id']
    ).order_by(Schedule.date, Schedule.shift).all()
    
    doctors = Doctor.query.filter_by(user_id=session['user_id']).all()
    
    leaves = Leave.query.filter(
        Leave.leave_date >= start_date, 
        Leave.leave_date <= end_date,
        Leave.user_id == session['user_id']
    ).all()
    
    # Organize leaves by doctor
    leaves_by_doctor = {}
    for l in leaves:
        leaves_by_doctor.setdefault(l.doctor_id, []).append(l.leave_date.isoformat())
        
    # Initialize doctor stats
    stats = {
        doc.id: {
            'doctor_id': doc.id,
            'doctor_name': doc.name,
            'priority': doc.priority,
            'morning_shifts': 0,
            'evening_shifts': 0,
            'total_shifts': 0,
            'leave_dates': sorted(leaves_by_doctor.get(doc.id, []))
        }
        for doc in doctors
    }
    
    # Calculate stats from actual scheduled shifts
    for s in schedules:
        for doc_id, shift_type in [(s.doctor_1_id, s.shift), (s.doctor_2_id, s.shift), (s.doctor_3_id, s.shift)]:
            if doc_id and doc_id in stats:
                stats[doc_id]['total_shifts'] += 1
                if shift_type == 'morning':
                    stats[doc_id]['morning_shifts'] += 1
                elif shift_type == 'evening':
                    stats[doc_id]['evening_shifts'] += 1
                    
    # Format stats as a list
    stats_list = list(stats.values())
    
    # Create workload ranking (sorted by total shifts ascending, ties broken by evening shifts, then name)
    rankings = sorted(stats_list, key=lambda x: (x['total_shifts'], x['evening_shifts'], x['doctor_name']))
    
    return jsonify({
        'schedules': [s.to_dict() for s in schedules],
        'stats': stats_list,
        'rankings': rankings,
        'month': month,
        'year': year
    })

@schedule_bp.route('/api/schedule/generate', methods=['POST'])
def generate_schedule_route():
    data = request.json or {}
    now = datetime.datetime.now()
    month = data.get('month', now.month)
    year = data.get('year', now.year)
    
    try:
        month = int(month)
        year = int(year)
    except ValueError:
        return jsonify({'error': 'Month and year must be integers'}), 400
        
    if not (1 <= month <= 12):
        return jsonify({'error': 'Month must be between 1 and 12'}), 400
        
    # Check if there are doctors in the system for this user
    if Doctor.query.filter_by(user_id=session['user_id']).count() == 0:
        return jsonify({'error': 'No doctors registered. Please add doctors first.'}), 400
        
    # Run the scheduling algorithm
    run_scheduler(db.session, month, year, session['user_id'])
    
    # Update or create schedule metadata
    meta = ScheduleMeta.query.filter_by(month=month, year=year, user_id=session['user_id']).first()
    if not meta:
        meta = ScheduleMeta(month=month, year=year, user_id=session['user_id'])
        db.session.add(meta)
    else:
        meta.created_at = datetime.datetime.utcnow()
    db.session.commit()
    
    # Fetch and return the newly generated schedule
    return get_schedule()

@schedule_bp.route('/api/schedule/<int:id>', methods=['PATCH'])
def update_schedule(id):
    sched = Schedule.query.filter_by(id=id, user_id=session['user_id']).first()
    if not sched:
        return jsonify({'error': 'Schedule record not found'}), 404
        
    data = request.json or {}
    
    # Helper function to validate if a doctor belongs to the user
    def validate_doctor_id(doc_id):
        if doc_id is None:
            return True
        doctor = Doctor.query.filter_by(id=doc_id, user_id=session['user_id']).first()
        return doctor is not None
    
    # Check for doctor updates
    if 'doctor_1_id' in data:
        val = data['doctor_1_id'] if data['doctor_1_id'] else None
        if not validate_doctor_id(val):
            return jsonify({'error': 'Doctor ID 1 does not exist or belong to this user'}), 400
        sched.doctor_1_id = val
        
    if 'doctor_2_id' in data:
        val = data['doctor_2_id'] if data['doctor_2_id'] else None
        if not validate_doctor_id(val):
            return jsonify({'error': 'Doctor ID 2 does not exist or belong to this user'}), 400
        sched.doctor_2_id = val
        
    if 'doctor_3_id' in data:
        val = data['doctor_3_id'] if data['doctor_3_id'] else None
        if not validate_doctor_id(val):
            return jsonify({'error': 'Doctor ID 3 does not exist or belong to this user'}), 400
        sched.doctor_3_id = val
        
    db.session.commit()
    
    return jsonify(sched.to_dict())

