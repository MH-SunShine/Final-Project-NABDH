# maps the working hours of each doctor per day
from app import db


class DoctorAvailability(db.Model):
    __tablename__ = 'doctor_availability'

    id = db.Column(db.Integer, primary_key=True)
    doctor_id = db.Column(db.Integer, db.ForeignKey('doctor.id'), nullable=False)
    day_of_week = db.Column(db.String(10), nullable=False)  # Example: 'Monday'
    start_time = db.Column(db.Time, nullable=False)
    end_time = db.Column(db.Time, nullable=False)

    doctor = db.relationship('Doctor', backref='availabilities')
