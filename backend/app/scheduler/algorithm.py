import datetime
import calendar
import random
from app.models import Doctor, Leave, Schedule

def get_previous_shift_doctors(session, date, shift, user_id):
    """
    Returns the set of doctor IDs scheduled for the shift immediately preceding the given date and shift.
    """
    if shift == 'morning':
        # Previous shift was evening of the previous day
        prev_date = date - datetime.timedelta(days=1)
        prev_shift = 'evening'
    else:
        # Previous shift was morning of the same day
        prev_date = date
        prev_shift = 'morning'
        
    prev_schedule = session.query(Schedule).filter_by(date=prev_date, shift=prev_shift, user_id=user_id).first()
    if prev_schedule:
        doc_ids = {prev_schedule.doctor_1_id, prev_schedule.doctor_2_id, prev_schedule.doctor_3_id}
        return {d_id for d_id in doc_ids if d_id is not None}
    return set()

def has_worked_four_consecutive_days(session, doctor_id, date, schedules_to_add, user_id):
    """
    Checks if the doctor has worked on all of the 4 consecutive days preceding the given date.
    """
    for offset in range(1, 5):
        prev_date = date - datetime.timedelta(days=offset)
        worked_on_day = False
        
        # Check current month's transient list first
        day_schedules = [s for s in schedules_to_add if s.date == prev_date]
        if day_schedules:
            for s in day_schedules:
                if doctor_id in (s.doctor_1_id, s.doctor_2_id, s.doctor_3_id):
                    worked_on_day = True
                    break
        else:
            # Query the database (for previous month's boundary)
            db_schedules = session.query(Schedule).filter_by(date=prev_date, user_id=user_id).all()
            for s in db_schedules:
                if doctor_id in (s.doctor_1_id, s.doctor_2_id, s.doctor_3_id):
                    worked_on_day = True
                    break
                    
        if not worked_on_day:
            return False
            
    return True

def get_stretch_length(session, doctor_id, date, schedules_to_add, user_id):
    """
    Returns the number of consecutive calendar days the doctor has worked immediately preceding the given date.
    """
    stretch = 0
    for offset in range(1, 5):
        prev_date = date - datetime.timedelta(days=offset)
        worked_on_day = False
        
        # Check current month's transient list first
        day_schedules = [s for s in schedules_to_add if s.date == prev_date]
        if day_schedules:
            for s in day_schedules:
                if doctor_id in (s.doctor_1_id, s.doctor_2_id, s.doctor_3_id):
                    worked_on_day = True
                    break
        else:
            # Query the database (for previous month's boundary)
            db_schedules = session.query(Schedule).filter_by(date=prev_date, user_id=user_id).all()
            for s in db_schedules:
                if doctor_id in (s.doctor_1_id, s.doctor_2_id, s.doctor_3_id):
                    worked_on_day = True
                    break
                    
        if worked_on_day:
            stretch += 1
        else:
            break
            
    return stretch

def select_best_doctor(session, candidates, workload_map, shift, date, schedules_to_add, user_id):
    """
    Among candidate doctors, select the one with the highest preference for duty.
    We prefer continuing a stretch of 1 or 2 days of duty (to make it a 2-3 day block),
    falling back to regular workload parameters if no active stretches exist.
    Ties are broken by fewest shifts of the current type, total shifts, and doctor ID.
    """
    if not candidates:
        return None
        
    def get_sort_key(doc):
        stretch = get_stretch_length(session, doc.id, date, schedules_to_add, user_id)
        # We prefer continuing a stretch of 1 or 2 days to build a 2-3 day schedule stretch
        stretch_pref = 0 if stretch in [1, 2] else 1
        return (
            stretch_pref,
            workload_map[doc.id][shift],
            workload_map[doc.id]['total'],
            random.random()
        )
        
    return min(candidates, key=get_sort_key)

def generate_schedule(session, month, year, user_id):
    """
    Generates the schedule for the given month and year.
    Clears any existing schedules for this month first.
    """
    # 1. Clear existing schedules for this month
    start_date = datetime.date(year, month, 1)
    last_day = calendar.monthrange(year, month)[1]
    end_date = datetime.date(year, month, last_day)
    
    session.query(Schedule).filter(Schedule.date >= start_date, Schedule.date <= end_date, Schedule.user_id == user_id).delete()
    session.commit()
    
    # 2. Load all doctors and leaves
    doctors = session.query(Doctor).filter(Doctor.user_id == user_id).all()
    if not doctors:
        return []
        
    leaves = session.query(Leave).filter(Leave.leave_date >= start_date, Leave.leave_date <= end_date, Leave.user_id == user_id).all()
    # Create a mapping of date -> set of doctor_ids on leave
    leave_map = {}
    for l in leaves:
        leave_map.setdefault(l.leave_date, set()).add(l.doctor_id)
        
    # Initialize workload tracking for the month
    workload_map = {doc.id: {'total': 0, 'morning': 0, 'evening': 0} for doc in doctors}
    
    schedules_to_add = []
    
    # 3. Schedule day-by-day
    for day in range(1, last_day + 1):
        current_date = datetime.date(year, month, day)
        on_leave_ids = leave_map.get(current_date, set())
        
        for shift in ['morning', 'evening']:
            # Find doctors who worked the previous shift (no back-to-back)
            prev_shift_doctor_ids = get_previous_shift_doctors(session, current_date, shift, user_id)
            
            # Find doctors who have worked the past 4 consecutive calendar days (maximum 4 continuous days limit)
            consecutive_work_excluded_ids = {
                doc.id for doc in doctors
                if has_worked_four_consecutive_days(session, doc.id, current_date, schedules_to_add, user_id)
            }
            
            # Additional check: exclude doctors already scheduled in the current shift's previous slots
            current_shift_assigned_ids = set()
            
            # Helper to get available candidates of a specific priority
            def get_available_candidates(priority):
                return [
                    doc for doc in doctors
                    if doc.priority == priority
                    and doc.id not in on_leave_ids
                    and doc.id not in prev_shift_doctor_ids
                    and doc.id not in current_shift_assigned_ids
                    and doc.id not in consecutive_work_excluded_ids
                ]
            
            # --- Slot 1: Priority 1 doctor (No replacement fallback) ---
            slot_1_candidates = get_available_candidates(1)
            doc_1 = select_best_doctor(session, slot_1_candidates, workload_map, shift, current_date, schedules_to_add, user_id)
            if doc_1:
                current_shift_assigned_ids.add(doc_1.id)
                workload_map[doc_1.id]['total'] += 1
                workload_map[doc_1.id][shift] += 1
                    
            # --- Slot 2: Priority 2 doctor ---
            slot_2_candidates = get_available_candidates(2)
            # Fallback: Priority 1
            if not slot_2_candidates:
                slot_2_candidates = get_available_candidates(1)
                
            doc_2 = select_best_doctor(session, slot_2_candidates, workload_map, shift, current_date, schedules_to_add, user_id)
            if doc_2:
                current_shift_assigned_ids.add(doc_2.id)
                workload_map[doc_2.id]['total'] += 1
                workload_map[doc_2.id][shift] += 1
                    
            # --- Slot 3: Priority 3 doctor ---
            slot_3_candidates = get_available_candidates(3)
            # Fallback: Priority 2 (P1 is never used as fallback here)
            if not slot_3_candidates:
                slot_3_candidates = get_available_candidates(2)
                
            doc_3 = select_best_doctor(session, slot_3_candidates, workload_map, shift, current_date, schedules_to_add, user_id)
            if doc_3:
                current_shift_assigned_ids.add(doc_3.id)
                workload_map[doc_3.id]['total'] += 1
                workload_map[doc_3.id][shift] += 1
            
            # Save shift schedule
            sched = Schedule(
                user_id=user_id,
                date=current_date,
                shift=shift,
                doctor_1_id=doc_1.id if doc_1 else None,
                doctor_2_id=doc_2.id if doc_2 else None,
                doctor_3_id=doc_3.id if doc_3 else None
            )
            schedules_to_add.append(sched)
            session.add(sched)
            
            # Commit transiently so get_previous_shift_doctors can see it for the next shift
            session.commit()
            
    return schedules_to_add


