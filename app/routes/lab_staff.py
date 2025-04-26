# app/routes/lab_staff.py
from flask import Blueprint, request, jsonify, render_template, redirect, url_for
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app import db
from app.models.lab_staff import LabStaff
from app.models.pending_verification import PendingVerification
from datetime import timedelta
import logging

lab_staff_bp = Blueprint('lab_staff_bp', __name__, url_prefix='/lab')

@lab_staff_bp.route('/signup', methods=['GET'])
def signup_page():
    return render_template('auth/signuplaboratory.html')

@lab_staff_bp.route('/login', methods=['GET'])
def login_page():
    return render_template('auth/loginlaboratory.html')

@lab_staff_bp.route('/dashboard')
@jwt_required()
def dashboard():
    try:
        # Get the current user's identity
        current_user_id = get_jwt_identity()
        if not current_user_id:
            return redirect(url_for('lab_staff_bp.login_page'))
        
        # Convert string ID back to integer
        lab_staff_id = int(current_user_id)
        lab_staff = LabStaff.query.get(lab_staff_id)
        
        if not lab_staff:
            logging.error(f'Lab staff not found for ID: {current_user_id}')
            return redirect(url_for('lab_staff_bp.login_page'))
            
        return render_template('dashboard/dashboardlaboratory.html', lab_staff=lab_staff)
    except Exception as e:
        logging.error(f'Dashboard error: {str(e)}')
        return redirect(url_for('lab_staff_bp.login_page'))

@lab_staff_bp.route('/signup', methods=['POST'])
def signup():
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'msg': 'No data provided'}), 400

        required_fields = ['lab_name', 'email', 'password', 'phone_number', 'address']
        for field in required_fields:
            if field not in data:
                return jsonify({'msg': f'Missing field: {field}'}), 400
            if not data[field]:  # Check if field is empty
                return jsonify({'msg': f'Field cannot be empty: {field}'}), 400

        # Check if email already exists in either table
        existing_email = LabStaff.query.filter_by(email=data['email']).first()
        if existing_email:
            return jsonify({'msg': 'Email already exists'}), 400
            
        existing_pending = PendingVerification.query.filter_by(email=data['email']).first()
        if existing_pending:
            return jsonify({'msg': 'Email already has a pending verification request'}), 400

        # Create new pending verification
        new_pending = PendingVerification(
            full_name=data['lab_name'],
            email=data['email'],
            role='lab'
        )
        # Hash the password
        new_pending.set_password(data['password'])

        try:
            db.session.add(new_pending)
            db.session.commit()
            return jsonify({'msg': 'Verification request submitted successfully'}), 201
        except Exception as e:
            db.session.rollback()
            logging.error(f'Database error during lab staff verification request: {str(e)}')
            return jsonify({'msg': 'Error submitting verification request'}), 500

    except Exception as e:
        logging.error(f'Unexpected error during lab staff signup: {str(e)}')
        return jsonify({'msg': 'An unexpected error occurred'}), 500

@lab_staff_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        logging.info('Lab staff login attempt received')
        
        if not data:
            logging.error('No JSON data in request')
            return jsonify({'error': 'No data provided'}), 400
            
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            logging.error('Missing email or password')
            return jsonify({'error': 'Email and password are required'}), 400

        # First check if there's a pending verification
        pending_verification = PendingVerification.query.filter_by(email=email, role='lab').first()
        if pending_verification:
            if pending_verification.status == 'pending':
                return jsonify({'error': 'Your account is pending approval'}), 401
            elif pending_verification.status == 'rejected':
                return jsonify({'error': 'Your account request was rejected'}), 401

        lab_staff = LabStaff.query.filter_by(email=email).first()
        logging.info(f'Lab staff found: {lab_staff is not None}')

        if not lab_staff or not lab_staff.check_password(password):
            logging.error('Invalid login attempt')
            return jsonify({'error': 'Invalid email or password'}), 401

        # Create token with string ID
        access_token = create_access_token(
            identity=str(lab_staff.id),
            expires_delta=timedelta(days=1)
        )
        
        logging.info('Login successful, token created')
        return jsonify({
            'access_token': access_token,
            'user_id': str(lab_staff.id)
        }), 200
            
    except Exception as e:
        logging.error(f'Login error: {str(e)}')
        return jsonify({'error': 'An unexpected error occurred'}), 500
