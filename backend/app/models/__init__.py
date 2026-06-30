from flask_sqlalchemy import SQLAlchemy
import datetime
import werkzeug.security

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)

    def set_password(self, password):
        self.password_hash = werkzeug.security.generate_password_hash(password)

    def check_password(self, password):
        return werkzeug.security.check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username
        }

class Doctor(db.Model):
    __tablename__ = 'doctors'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    priority = db.Column(db.Integer, nullable=False)  # 1, 2, or 3
    
    # Relationships
    leaves = db.relationship('Leave', backref='doctor', cascade='all, delete-orphan', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'priority': self.priority
        }

class Leave(db.Model):
    __tablename__ = 'leaves'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    doctor_id = db.Column(db.Integer, db.ForeignKey('doctors.id', ondelete='CASCADE'), nullable=False)
    leave_date = db.Column(db.Date, nullable=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'doctor_id': self.doctor_id,
            'leave_date': self.leave_date.isoformat()
        }

class Schedule(db.Model):
    __tablename__ = 'schedules'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    shift = db.Column(db.String(20), nullable=False)  # 'morning' or 'evening'
    doctor_1_id = db.Column(db.Integer, db.ForeignKey('doctors.id', ondelete='SET NULL'), nullable=True) # Priority 1 slot
    doctor_2_id = db.Column(db.Integer, db.ForeignKey('doctors.id', ondelete='SET NULL'), nullable=True) # Priority 2 slot
    doctor_3_id = db.Column(db.Integer, db.ForeignKey('doctors.id', ondelete='SET NULL'), nullable=True) # Priority 3 slot
    
    # Relationships to access the doctor objects
    doctor_1 = db.relationship('Doctor', foreign_keys=[doctor_1_id])
    doctor_2 = db.relationship('Doctor', foreign_keys=[doctor_2_id])
    doctor_3 = db.relationship('Doctor', foreign_keys=[doctor_3_id])

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'date': self.date.isoformat(),
            'shift': self.shift,
            'doctor_1_id': self.doctor_1_id,
            'doctor_2_id': self.doctor_2_id,
            'doctor_3_id': self.doctor_3_id,
            'doctor_1': self.doctor_1.to_dict() if self.doctor_1 else None,
            'doctor_2': self.doctor_2.to_dict() if self.doctor_2 else None,
            'doctor_3': self.doctor_3.to_dict() if self.doctor_3 else None,
        }

class ScheduleMeta(db.Model):
    __tablename__ = 'schedule_meta'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    month = db.Column(db.Integer, nullable=False)
    year = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'month': self.month,
            'year': self.year,
            'created_at': self.created_at.isoformat()
        }

