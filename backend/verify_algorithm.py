import unittest
import datetime
import calendar
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import db, Doctor, Leave, Schedule
from app.scheduler.algorithm import generate_schedule

class TestSchedulerAlgorithm(unittest.TestCase):
    def setUp(self):
        # Use SQLite in-memory database for testing
        self.engine = create_engine('sqlite:///:memory:')
        db.metadata.create_all(self.engine)
        Session = sessionmaker(bind=self.engine)
        self.session = Session()
        
        # Add test doctors
        self.doctors = [
            # Priority 1
            Doctor(id=1, name="Dr. P1-A", priority=1),
            Doctor(id=2, name="Dr. P1-B", priority=1),
            Doctor(id=3, name="Dr. P1-C", priority=1),
            # Priority 2
            Doctor(id=4, name="Dr. P2-A", priority=2),
            Doctor(id=5, name="Dr. P2-B", priority=2),
            Doctor(id=8, name="Dr. P2-C", priority=2),
            # Priority 3
            Doctor(id=6, name="Dr. P3-A", priority=3),
            Doctor(id=7, name="Dr. P3-B", priority=3),
            Doctor(id=9, name="Dr. P3-C", priority=3)
        ]
        self.session.bulk_save_objects(self.doctors)
        self.session.commit()
        
    def tearDown(self):
        self.session.close()
        db.metadata.drop_all(self.engine)

    def test_basic_generation(self):
        # Generate schedule for June 2026
        month = 6
        year = 2026
        last_day = calendar.monthrange(year, month)[1]
        
        schedules = generate_schedule(self.session, month, year)
        
        # We expect 2 shifts per day, for 30 days = 60 shifts
        self.assertEqual(len(schedules), 60)
        
        # Check that each shift has doctors assigned
        for s in schedules:
            self.assertIsNotNone(s.doctor_1_id, f"Slot 1 empty on {s.date} {s.shift}")
            self.assertIsNotNone(s.doctor_2_id, f"Slot 2 empty on {s.date} {s.shift}")
            self.assertIsNotNone(s.doctor_3_id, f"Slot 3 empty on {s.date} {s.shift}")
            
    def test_no_back_to_back_shifts(self):
        # Generate schedule
        generate_schedule(self.session, 6, 2026)
        
        schedules = self.session.query(Schedule).all()
        # Sort chronologically (morning then evening)
        schedules = sorted(schedules, key=lambda s: (s.date, 0 if s.shift == 'morning' else 1))
        
        for i in range(1, len(schedules)):
            prev = schedules[i-1]
            curr = schedules[i]
            
            # Check if curr is immediately after prev (either same day evening after morning, or next day morning after evening)
            is_adjacent = False
            if prev.date == curr.date and prev.shift == 'morning' and curr.shift == 'evening':
                is_adjacent = True
            elif curr.date == prev.date + datetime.timedelta(days=1) and prev.shift == 'evening' and curr.shift == 'morning':
                is_adjacent = True
                
            if is_adjacent:
                prev_docs = {prev.doctor_1_id, prev.doctor_2_id, prev.doctor_3_id}
                curr_docs = {curr.doctor_1_id, curr.doctor_2_id, curr.doctor_3_id}
                
                intersection = prev_docs.intersection(curr_docs)
                # Filter out None values
                intersection = {d for d in intersection if d is not None}
                
                self.assertEqual(len(intersection), 0, f"Back-to-back violation between {prev.date} {prev.shift} and {curr.date} {curr.shift}: {intersection}")

    def test_leave_day_exclusion(self):
        # Set leaves for Dr. P1-A (id=1) on June 5th and June 6th
        leave1 = Leave(doctor_id=1, leave_date=datetime.date(2026, 6, 5))
        leave2 = Leave(doctor_id=1, leave_date=datetime.date(2026, 6, 6))
        self.session.add_all([leave1, leave2])
        self.session.commit()
        
        generate_schedule(self.session, 6, 2026)
        
        schedules = self.session.query(Schedule).filter(
            Schedule.date.in_([datetime.date(2026, 6, 5), datetime.date(2026, 6, 6)])
        ).all()
        
        for s in schedules:
            assigned = {s.doctor_1_id, s.doctor_2_id, s.doctor_3_id}
            self.assertNotIn(1, assigned, f"Dr. P1-A scheduled on leave date {s.date} {s.shift}")

    def test_priority_fallbacks(self):
        # If we put all P2 doctors on leave for June 10th
        # Slot 2 (P2 slot) should fallback to P1 in the morning shift
        leave_p2_1 = Leave(doctor_id=4, leave_date=datetime.date(2026, 6, 10))
        leave_p2_2 = Leave(doctor_id=5, leave_date=datetime.date(2026, 6, 10))
        self.session.add_all([leave_p2_1, leave_p2_2])
        self.session.commit()
        
        generate_schedule(self.session, 6, 2026)
        
        # Query morning schedule on June 10th
        s = self.session.query(Schedule).filter_by(date=datetime.date(2026, 6, 10), shift='morning').first()
        self.assertIsNotNone(s)
        
        # Slot 2 (P2) doctor should be a P1 doctor (id in [1, 2, 3])
        doc2 = self.session.query(Doctor).get(s.doctor_2_id)
        self.assertEqual(doc2.priority, 1, f"Slot 2 did not fallback to P1 on {s.date} {s.shift}, got P{doc2.priority}")


    def test_no_replace_for_p1(self):
        # Put all P1 doctors (id=1,2,3) on leave for June 12th
        leaves = [
            Leave(doctor_id=1, leave_date=datetime.date(2026, 6, 12)),
            Leave(doctor_id=2, leave_date=datetime.date(2026, 6, 12)),
            Leave(doctor_id=3, leave_date=datetime.date(2026, 6, 12))
        ]
        self.session.add_all(leaves)
        self.session.commit()
        
        generate_schedule(self.session, 6, 2026)
        
        # Verify that for June 12th shifts, Slot 1 is empty (None)
        schedules = self.session.query(Schedule).filter_by(date=datetime.date(2026, 6, 12)).all()
        self.assertEqual(len(schedules), 2)
        for s in schedules:
            self.assertIsNone(s.doctor_1_id, f"Slot 1 was replaced on {s.date} {s.shift} despite no P1 doctors available")

    def test_max_consecutive_days(self):
        # Generate schedule
        generate_schedule(self.session, 6, 2026)
        
        schedules = self.session.query(Schedule).all()
        
        # Build a mapping of doctor_id -> set of dates they worked
        worked_dates = {}
        for s in schedules:
            for d_id in (s.doctor_1_id, s.doctor_2_id, s.doctor_3_id):
                if d_id:
                    worked_dates.setdefault(d_id, set()).add(s.date)
                    
        # Check that no doctor worked 5 consecutive days
        for d_id, dates in worked_dates.items():
            for d in dates:
                has_five = True
                for offset in range(1, 5):
                    next_day = d + datetime.timedelta(days=offset)
                    if next_day not in dates:
                        has_five = False
                        break
                self.assertFalse(has_five, f"Doctor {d_id} worked 5 consecutive calendar days starting {d}")

    def test_workload_balance(self):
        # Over a month (30 days), we check if the schedules are relatively balanced.
        generate_schedule(self.session, 6, 2026)
        schedules = self.session.query(Schedule).all()
        
        # Calculate counts
        counts = {doc.id: {'total': 0, 'morning': 0, 'evening': 0} for doc in self.doctors}
        for s in schedules:
            for d_id, shift_type in [(s.doctor_1_id, s.shift), (s.doctor_2_id, s.shift), (s.doctor_3_id, s.shift)]:
                if d_id:
                    counts[d_id]['total'] += 1
                    counts[d_id][shift_type] += 1
                    
        print("\nWorkload distribution details:")
        for doc in self.doctors:
            c = counts[doc.id]
            print(f"{doc.name} (P{doc.priority}): Total={c['total']}, Morning={c['morning']}, Evening={c['evening']}")
            
        # P1 doctors should share the P1 slots + any fallbacks.
        p1_totals = [counts[1]['total'], counts[2]['total'], counts[3]['total']]
        self.assertTrue(max(p1_totals) - min(p1_totals) <= 3, f"P1 workload unbalanced: {p1_totals}")
        
        p2_totals = [counts[4]['total'], counts[5]['total'], counts[8]['total']]
        self.assertTrue(max(p2_totals) - min(p2_totals) <= 3, f"P2 workload unbalanced: {p2_totals}")
        
        p3_totals = [counts[6]['total'], counts[7]['total'], counts[9]['total']]
        self.assertTrue(max(p3_totals) - min(p3_totals) <= 3, f"P3 workload unbalanced: {p3_totals}")

if __name__ == '__main__':
    unittest.main()
