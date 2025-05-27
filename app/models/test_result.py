from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class TestResult(db.Model):
    __tablename__ = 'test_result'

    id = db.Column(db.Integer, primary_key=True)
    test_request_id = db.Column(db.Integer, db.ForeignKey('test_request.id'), unique=True, nullable=False)
    lab_staff_id = db.Column(db.Integer, db.ForeignKey('lab_staff.id'), nullable=False)
    result_data = db.Column(db.Text, nullable=False)
    ai_analysis = db.Column(db.Text)  # ✅ New column
    submitted_at = db.Column(db.DateTime)


    # Relationships
    request = db.relationship('TestRequest', back_populates='result')