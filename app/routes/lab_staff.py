# app/routes/lab_staff.py
from flask import Blueprint, request, jsonify, render_template, redirect, url_for
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app import db
from app.models.lab_staff import LabStaff
from app.models.pending_verification import PendingVerification
from datetime import timedelta, datetime
from app.models.test_result import TestResult
from app.models.ai_analysis import AIAnalysis
import logging
import requests

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


@lab_staff_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_lab_profile():
    # . Get the logged-in user's ID from the JWT token
    lab_id = get_jwt_identity()

    # . Query the database
    lab = LabStaff.query.get(lab_id)
    if not lab:
        return jsonify({"status": "error", "message": "Laboratory not found"}), 404

    # . the expected response structure 
    response = {
        "status": "success",
        "data": {
            "id": lab.id,
            "lab_name": lab.lab_name,
            "email": lab.email,
            "phone_number": lab.phone_number,
            "address": lab.address
        }
    }

    # 6. Return it as JSON
    return jsonify(response), 200


@lab_staff_bp.route('/test/import', methods=['POST'])
@jwt_required()
def import_test_result():
    try:
        lab_staff_id = get_jwt_identity()
        
        # Get form data
        test_request_id = request.form.get('test_request_id')
        if not test_request_id:
            return jsonify({'error': 'Test request ID is required'}), 400
            
        # Check if file was uploaded
        if 'file' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400
            
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
            
        # Read file content
        file_content = file.read().decode('utf-8', errors='ignore')
        
        # Create new test result
        new_result = TestResult(
            test_request_id=int(test_request_id),
            lab_staff_id=int(lab_staff_id),
            result_data=file_content,  # Store the file content in the database
            submitted_at=datetime.utcnow()
        )
        
        # Save to database
        db.session.add(new_result)
        db.session.commit()
        
        return jsonify({
            'status': 'success',
            'message': 'Test results imported successfully',
            'result_id': new_result.id
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logging.error(f'Error importing test results: {str(e)}')
        return jsonify({'error': str(e)}), 500


@lab_staff_bp.route('/lab/test/ai_analysis', methods=['GET'])
def analyze_test_result():
    test_request_id = request.args.get('test_request_id')

    if not test_request_id:
        return jsonify({"error": "Missing test_request_id"}), 400

    result = TestResult.query.filter_by(test_request_id=test_request_id).first()
    if not result:
        return jsonify({"error": "Test result not found"}), 404

    content = result.result_data

    prompt = f"""
You are a medical assistant. A lab staff has submitted the following test result:
---
{content}
---
Analyze the result and answer these:

1.  What are the abnormal markers and what do they mean?
2.  What might the patient have (possible diagnosis)?
3.  What follow-up tests do you recommend?
4.  Medical recommendations or actions?

Respond clearly and concisely in this format:
- Abnormal Markers:
- Diagnosis:
- Recommended Tests:
- Medical Advice:
"""

    try:
        # request to OpenRouter API
        headers = {
            "Authorization": "Bearer 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",
            "Content-Type": "application/json"
        }

        body = {
            "model": "openai/gpt-3.5-turbo",
            "messages": [
                {"role": "system", "content": "You are a helpful medical assistant."},
                {"role": "user", "content": prompt}
            ]
        }

        response = requests.post("https://openrouter.ai/api/v1/chat/completions", json=body, headers=headers)
        response.raise_for_status()

        data = response.json()
        ai_output = data['choices'][0]['message']['content']

        new_analysis = AIAnalysis(
            test_result_id=result.id,
            analysis_result=ai_output,
            created_at=datetime.utcnow()
        )
        db.session.add(new_analysis)
        db.session.commit()

        return jsonify({
            "test_request_id": test_request_id,
            "analysis_result": ai_output
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500