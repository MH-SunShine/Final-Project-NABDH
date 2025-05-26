from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class TestRequest(db.Model):
    __tablename__ = 'test_request'
    
    id = db.Column(db.Integer, primary_key=True)
    doctor_id = db.Column(db.Integer, db.ForeignKey('doctor.id'), nullable=False)
    medical_record_id = db.Column(db.Integer, db.ForeignKey('medical_record.id'), nullable=False)
    test_type = db.Column(db.String(100), nullable=False)
    submitted_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)

    # Relationship (optional)
    result = db.relationship('TestResult', back_populates='request', uselist=False)
