# app/routes/doctor.py
from flask import Blueprint, request, jsonify, render_template, redirect, url_for
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app import db
from app.models.doctor import Doctor
from app.models.pending_verification import PendingVerification
from datetime import timedelta, datetime
import logging

doctor_bp = Blueprint('doctor_bp', __name__, url_prefix='/doctor')

@doctor_bp.route('/signup', methods=['GET'])
def signup_page():
    return render_template('auth/signupdoctor.html')

@doctor_bp.route('/login', methods=['GET'])
def login_page():
    return render_template('auth/logindoctor.html')

@doctor_bp.route('/dashboard')
@jwt_required()
def dashboard():
    try:
        # Get the current user's identity
        current_user_id = get_jwt_identity()
        if not current_user_id:
            return redirect(url_for('doctor_bp.login_page'))
        
        # Convert string ID back to integer
        doctor_id = int(current_user_id)
        doctor = Doctor.query.get(doctor_id)
        
        if not doctor:
            logging.error(f'Doctor not found for ID: {current_user_id}')
            return redirect(url_for('doctor_bp.login_page'))
            
        return render_template('dashboard/dashboarddoctor.html', doctor=doctor)
    except Exception as e:
        logging.error(f'Dashboard error: {str(e)}')
        return redirect(url_for('doctor_bp.login_page'))

@doctor_bp.route('/signup', methods=['POST'])
def signup():
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'msg': 'No data provided'}), 400

        required_fields = ['fullname', 'email', 'password', 'phone_number', 'gender', 'medical_specialty']
        for field in required_fields:
            if field not in data:
                return jsonify({'msg': f'Missing field: {field}'}), 400
            if not data[field]:  # Check if field is empty
                return jsonify({'msg': f'Field cannot be empty: {field}'}), 400

        # Check if email already exists in either table
        existing_email = Doctor.query.filter_by(email=data['email']).first()
        if existing_email:
            return jsonify({'msg': 'Email already exists'}), 400
            
        existing_pending = PendingVerification.query.filter_by(email=data['email']).first()
        if existing_pending:
            return jsonify({'msg': 'Email already has a pending verification request'}), 400

        # Create new pending verification
        new_pending = PendingVerification(
            full_name=data['fullname'],
            email=data['email'],
            role='doctor'
        )
        # Hash the password
        new_pending.set_password(data['password'])

        try:
            db.session.add(new_pending)
            db.session.commit()
            return jsonify({'msg': 'Verification request submitted successfully'}), 201
        except Exception as e:
            db.session.rollback()
            logging.error(f'Database error during doctor verification request: {str(e)}')
            return jsonify({'msg': 'Error submitting verification request'}), 500

    except Exception as e:
        logging.error(f'Unexpected error during doctor signup: {str(e)}')
        return jsonify({'msg': 'An unexpected error occurred'}), 500

@doctor_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        logging.info('Doctor login attempt received')
        
        if not data:
            logging.error('No JSON data in request')
            return jsonify({'error': 'No data provided'}), 400
            
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            logging.error('Missing email or password')
            return jsonify({'error': 'Email and password are required'}), 400

        # First check if there's a pending verification
        pending_verification = PendingVerification.query.filter_by(email=email, role='doctor').first()
        if pending_verification:
            if pending_verification.status == 'pending':
                return jsonify({'error': 'Your account is pending approval'}), 401
            elif pending_verification.status == 'rejected':
                return jsonify({'error': 'Your account request was rejected'}), 401

        doctor = Doctor.query.filter_by(email=email).first()
        logging.info(f'Doctor found: {doctor is not None}')

        if not doctor or not doctor.check_password(password):
            logging.error('Invalid login attempt')
            return jsonify({'error': 'Invalid email or password'}), 401

        # Create token with string ID
        access_token = create_access_token(
            identity=str(doctor.id),
            expires_delta=timedelta(days=1)
        )
        
        logging.info('Login successful, token created')
        return jsonify({
            'access_token': access_token,
            'user_id': str(doctor.id)
        }), 200
            
    except Exception as e:
        logging.error(f'Login error: {str(e)}')
        return jsonify({'error': 'An unexpected error occurred'}), 500


@doctor_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_doctor_profile():
    # . Get the logged-in user's ID from the JWT token
    doctor_id = get_jwt_identity()

    # . Query the database for the doctor according to the id
    doctor = Doctor.query.get(doctor_id)
    if not doctor:
        return jsonify({"status": "error", "message": "Doctor not found"}), 404

    # . the expected response structure 
    response = {
        "status": "success",
        "data": {
            "id": doctor.id,
            "full_name": doctor.fullname,
            "email": doctor.email,
            "phone_number": doctor.phone_number,
            "Medical_specialty": doctor.medical_specialty,
            "gender": doctor.gender,
            "birth_date": doctor.birth_date.isoformat() if doctor.birth_date else None
        }
    }

    # 6. Return it as JSON
    return jsonify(response), 200

# @doctor_bp.route('/availability/set', methods=['POST'])
# @jwt_required()
# def set_availability():
#     try:
#         doctor_id = get_jwt_identity()
#         data = request.json
        
#         if not data or 'availabilities' not in data:
#             return jsonify({"status": "error", "message": "Invalid data format"}), 400
        
#         # Delete existing availabilities
#         DoctorAvailability.query.filter_by(doctor_id=doctor_id).delete()
        
#         # Add new availabilities
#         for avail in data['availabilities']:
#             if 'day' not in avail or 'start_time' not in avail or 'end_time' not in avail:
#                 continue
                
#             new_avail = DoctorAvailability(
#                 doctor_id=doctor_id,
#                 day_of_week=avail['day'],
#                 start_time=datetime.strptime(avail['start_time'], '%H:%M').time(),
#                 end_time=datetime.strptime(avail['end_time'], '%H:%M').time()
#             )
#             db.session.add(new_avail)
        
#         db.session.commit()
        
#         return jsonify({
#             "status": "success",
#             "message": "Availability updated successfully"
#         }), 200
#     except Exception as e:
#         db.session.rollback()
#         logging.error(f"Error setting availability: {str(e)}")
#         return jsonify({
#             "status": "error",
#             "message": "Failed to update availability",
#             "error": str(e)
#         }), 500
