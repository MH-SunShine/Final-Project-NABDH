# app/routes/patient.py
from flask import Blueprint, request, jsonify, render_template, redirect, url_for
from app.models.patient import Patient
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app import db
from datetime import timedelta, datetime
import logging


patient_bp = Blueprint('patient_bp', __name__, url_prefix='/patient')

@patient_bp.route('/signup', methods=['GET'])
def signup_page():
    return render_template('auth/signuppatient.html')

@patient_bp.route('/login', methods=['GET'])
def login_page():
    return render_template('auth/loginpatient.html')

@patient_bp.route('/dashboard')
@jwt_required()
def dashboard():
    try:
        # Get the current user's identity
        current_user_id = get_jwt_identity()
        if not current_user_id:
            return redirect(url_for('patient_bp.login_page'))
        
        # Convert string ID back to integer
        patient_id = int(current_user_id)
        patient = Patient.query.get(patient_id)
        
        if not patient:
            logging.error(f'Patient not found for ID: {current_user_id}')
            return redirect(url_for('patient_bp.login_page'))
            
        return render_template('dashboard/dashboardpatient.html', patient=patient)
    except Exception as e:
        logging.error(f'Dashboard error: {str(e)}')
        return redirect(url_for('patient_bp.login_page'))

# Signup route
@patient_bp.route('/signup', methods=['POST'])
def signup():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'msg': 'No data provided'}), 400

        required_fields = ['fullname', 'email', 'password', 'phone_number', 'gender', 'birth_date']
        for field in required_fields:
            if field not in data:
                return jsonify({'msg': f'Missing field: {field}'}), 400
            if not data[field]:  # Check if field is empty
                return jsonify({'msg': f'Field cannot be empty: {field}'}), 400

        # Check if email already exists
        existing_email = Patient.query.filter_by(email=data['email']).first()
        if existing_email:
            return jsonify({'msg': 'Email already exists'}), 400

        # Check if phone number already exists
        existing_phone = Patient.query.filter_by(phone_number=data['phone_number']).first()
        if existing_phone:
            return jsonify({'msg': 'Phone number already exists'}), 400

        # Convert birth_date string to Date object
        try:
            birth_date = datetime.strptime(data['birth_date'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'msg': 'Invalid birth date format. Use YYYY-MM-DD'}), 400

        new_patient = Patient(
            fullname=data['fullname'],
            email=data['email'],
            phone_number=data['phone_number'],
            gender=data['gender'],
            birth_date=birth_date
        )
        # Hash the password
        new_patient.set_password(data['password'])

        try:
            db.session.add(new_patient)
            db.session.commit()
            return jsonify({'msg': 'Patient created successfully'}), 201
        except Exception as e:
            db.session.rollback()
            print(f"Database error: {str(e)}")  # Log the error
            return jsonify({'msg': 'Error creating patient in database'}), 500

    except Exception as e:
        print(f"Unexpected error: {str(e)}")  # Log the error
        return jsonify({'msg': 'An unexpected error occurred'}), 500

@patient_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        logging.info('Login attempt received')
        
        if not data:
            logging.error('No JSON data in request')
            return jsonify({'error': 'No data provided'}), 400
            
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            logging.error('Missing email or password')
            return jsonify({'error': 'Email and password are required'}), 400

        patient = Patient.query.filter_by(email=email).first()
        logging.info(f'Patient found: {patient is not None}')

        if not patient or not patient.check_password(password):
            logging.error('Invalid login attempt')
            return jsonify({'error': 'Invalid email or password'}), 401

        # Create token with string ID
        access_token = create_access_token(
            identity=str(patient.id),
            expires_delta=timedelta(days=1)
        )
        
        logging.info('Login successful, token created')
        return jsonify({
            'access_token': access_token,
            'user_id': str(patient.id)
        }), 200
            
    except Exception as e:
        logging.error(f'Login error: {str(e)}')
        return jsonify({'error': 'An unexpected error occurred'}), 500


protected_bp = Blueprint('protected_bp', __name__)


@protected_bp.route('/protected', methods=['GET'])
@jwt_required()
def protected():
    current_user = get_jwt_identity()
    return jsonify(message=f"Hello {current_user}, you are accessing a protected route!")
