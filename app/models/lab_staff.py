import bcrypt
from datetime import datetime, timezone
from app import db


class LabStaff(db.Model):
    __tablename__ = 'labstaff'

    id = db.Column(db.Integer, primary_key=True)
    lab_name = db.Column(db.String(100), nullable=False, unique=True)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    phone_number = db.Column(db.String(100), unique=True, nullable=False)
    address = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # def set_password(self, password):
    #     self.password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    #
    # def check_password(self, password):
    #     return bcrypt.checkpw(password.encode('utf-8'), self.password)

    def set_password(self, password):
        hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        self.password = hashed.decode('utf-8')  # Save as string

    def check_password(self, password):
        return bcrypt.checkpw(password.encode('utf-8'), self.password.encode('utf-8'))  # Compare as bytes
