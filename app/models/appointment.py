# stores scheduled appointments between patients and doctors
from app import db


class Appointment(db.Model):
    __tablename__ = 'appointment'

    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('patient.id'), nullable=False)
    doctor_id = db.Column(db.Integer, db.ForeignKey('doctor.id'), nullable=False)
    status = db.Column(db.String(20), nullable=False, default='scheduled')  # 'scheduled', 'cancelled', etc.
    created_at = db.Column(db.DateTime, nullable=False)

    patient = db.relationship('Patient', backref='appointments')
    doctor = db.relationship('Doctor', backref='appointments')
