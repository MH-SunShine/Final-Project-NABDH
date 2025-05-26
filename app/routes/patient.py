from flask import Blueprint, request, jsonify, render_template, redirect, url_for
from app.models.patient import Patient, AppointmentStatus
from app.models.doctor_availability import DoctorAvailability
from app.models.doctor import Doctor
from app.models.appointment import Appointment
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app import db
from datetime import timedelta, datetime
import logging
import traceback

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

        # Create new patient instance
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
            # Add new patient to the database and commit
            db.session.add(new_patient)
            db.session.commit()
            return jsonify({'msg': 'Patient created successfully'}), 201
        except Exception as e:
            # If database error occurs, rollback the session and log the error
            db.session.rollback()
            traceback.print_exc()
            logging.error(f"Database error: {e.__class__.__name__} - {str(e)}")
            return jsonify({'msg': 'Error creating patient in database'}), 500

    except Exception as e:
        logging.error(f"Unexpected error: {str(e)}")  # Log unexpected errors
        return jsonify({'msg': 'An unexpected error occurred'}), 500


# Login route
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


@patient_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_patient_profile():
    # . Get the logged-in user's ID from the JWT token
    patient_id = get_jwt_identity()

    # . Query the database for the patient
    patient = Patient.query.get(patient_id)
    if not patient:
        return jsonify({"status": "error", "message": "Patient not found"}), 404

    # . Define the expected response structure (right here)
    response = {
        "status": "success",
        "data": {
            "id": patient.id,
            "fullname": patient.fullname,
            "email": patient.email,
            "phone_number": patient.phone_number,
            "gender": patient.gender,
            "birth_date": patient.birth_date.isoformat() if patient.birth_date else None
        }
    }

    # 6. Return it as JSON
    return jsonify(response), 200


@patient_bp.route('/apt/book', methods=['POST'])
@jwt_required()
def book_appointment():
    try:
        data = request.get_json()
        logging.info(f"Booking appointment with data: {data}")
        
        doctor_name = data.get('doctor_name')
        specialty = data.get('medical_specialty')
        date_str = data.get('date')  # Format: "2025-05-18"
        time_str = data.get('time')  # Format: "14:00"

        # Step 1: Validate input
        if not all([doctor_name, specialty, date_str, time_str]):
            logging.error(f"Missing required fields: {data}")
            return jsonify({"status": "error", "message": "Missing required fields"}), 400

        try:
            appointment_date = datetime.strptime(date_str, "%Y-%m-%d").date()
            appointment_time = datetime.strptime(time_str, "%H:%M").time()
            logging.info(f"Parsed date: {appointment_date}, time: {appointment_time}")
        except ValueError as e:
            logging.error(f"Invalid date or time format: {e}")
            return jsonify({"status": "error", "message": "Invalid date or time format"}), 400

        # Step 2: Find doctor by name and specialty
        doctor = Doctor.query.filter_by(fullname=doctor_name, medical_specialty=specialty).first()
        if not doctor:
            logging.error(f"Doctor not found: {doctor_name}, {specialty}")
            return jsonify({"status": "error", "message": "Doctor not found"}), 404

        # Step 3: Check availability for that day of week
        day_of_week = appointment_date.strftime("%A")  # e.g., 'Monday'
        availability = DoctorAvailability.query.filter_by(doctor_id=doctor.id, day_of_week=day_of_week).first()

        if not availability:
            logging.error(f"Doctor {doctor_name} is not available on {day_of_week}")
            return jsonify({"status": "error", "message": f"{doctor_name} is not available on {day_of_week}"}), 400

        # Check if time is within availability window (doctor's working hours)
        if not (availability.start_time <= appointment_time < availability.end_time):
            logging.error(f"Selected time {time_str} is outside doctor's working hours: {availability.start_time}-{availability.end_time}")
            return jsonify({"status": "error", "message": "Selected time is outside doctor's working hours"}), 400

        # Step 4: Check for duplicates (if already booked: same doctor-day-time)
        slot_start = datetime.combine(appointment_date, appointment_time)
        slot_end = slot_start + timedelta(minutes=30)  # 30mn for each slot

        existing = Appointment.query.filter(
            Appointment.doctor_id == doctor.id,
            Appointment.status == AppointmentStatus.PENDING,
            Appointment.created_at >= slot_start,
            Appointment.created_at < slot_end
        ).first()
        
        if existing:
            logging.error(f"Slot already booked: {slot_start} - {slot_end}")
            return jsonify({"status": "error", "message": "This slot is already booked"}), 409

        # Step 5: Save appointment
        patient_id = get_jwt_identity()
        logging.info(f"Creating appointment for patient {patient_id} with doctor {doctor.id}")
        
        new_appointment = Appointment(
            patient_id=patient_id,
            doctor_id=doctor.id,
            status=AppointmentStatus.PENDING,
            created_at=slot_start
        )
        db.session.add(new_appointment)
        db.session.commit()
        
        logging.info(f"Appointment created successfully with ID: {new_appointment.id}")

        return jsonify({
            "status": "success",
            "message": f"Appointment booked with Dr. {doctor.fullname} ({doctor.medical_specialty}) on {date_str} at {time_str}",
            "appointment_id": new_appointment.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        logging.error(f"Error booking appointment: {str(e)}")
        traceback.print_exc()
        return jsonify({"status": "error", "message": f"An error occurred: {str(e)}"}), 500


@patient_bp.route('/apt/view', methods=['GET'])
@jwt_required()
def view_my_appointments():
    patient_id = get_jwt_identity()

    # 1: Get all pending appointments for this patient
    appointments = (
        db.session.query(Appointment, Doctor)
        .join(Doctor, Appointment.doctor_id == Doctor.id)
        .filter(
            Appointment.patient_id == patient_id,
            Appointment.status == 'pending'
        )
        .order_by(Appointment.created_at.asc())
        .all()
    )

    # 2: Format response (according to front table)
    result = []
    for appointment, doctor in appointments:
        start_time = appointment.created_at.time()
        end_time = (appointment.created_at + timedelta(minutes=30)).time()

        result.append({
            "appointment_id": appointment.id,
            "doctor_name": doctor.fullname,
            "specialty": doctor.medical_specialty,
            "date": appointment.created_at.strftime('%d/%m/%Y'),
            "time_range": f"{start_time.strftime('%I:%M %p')} - {end_time.strftime('%I:%M %p')}",
            "status": appointment.status
        })

    return jsonify({
        "status": "success",
        "appointments": result
    }), 200


@patient_bp.route('/apt/cancel/<int:appointment_id>', methods=['DELETE'])
@jwt_required()
def cancel_appointment(appointment_id):
    patient_id = get_jwt_identity()

    # 1: Get the appointment for this patient by its id
    appointment = Appointment.query.filter_by(id=appointment_id, patient_id=patient_id).first()

    if not appointment:
        return jsonify({"status": "error", "message": "Appointment not found"}), 404

    if appointment.status == "completed":
        return jsonify({"status": "error", "message": "Completed appointments cannot be cancelled"}), 400

    # 2: Mark as cancelled ( change status )
    appointment.status = "canceled"
    db.session.commit()

    return jsonify({
        "status": "success",
        "message": f"Appointment on {appointment.created_at.strftime('%d/%m/%Y %H:%M')} was cancelled."
    }), 200


@patient_bp.route('/logout', methods=['GET'])
def logout():
    # No need to handle token invalidation server-side since we're using JWT
    # The client will handle removing the token
    return redirect(url_for('patient_bp.login_page'))


@patient_bp.route('/doctors/available', methods=['GET'])
@jwt_required()
def get_available_doctors():
    try:
        logging.info("Fetching doctors with availability")
        
        # Get all doctors from the database
        doctors = Doctor.query.all()
        logging.info(f"Found {len(doctors)} doctors")
        
        # Format the response with availability
        doctors_list = []
        for doctor in doctors:
            # Get doctor's availability
            availabilities = DoctorAvailability.query.filter_by(doctor_id=doctor.id).all()
            
            # Format availability for frontend
            availability_data = []
            for avail in availabilities:
                availability_data.append({
                    "day": avail.day_of_week,
                    "start_time": avail.start_time.strftime('%H:%M'),
                    "end_time": avail.end_time.strftime('%H:%M')
                })
            
            doctors_list.append({
                "id": doctor.id,
                "name": doctor.fullname,
                "specialty": doctor.medical_specialty,
                "email": doctor.email,
                "phone": doctor.phone_number,
                "availability": availability_data
            })
        
        return jsonify({
            "status": "success",
            "doctors": doctors_list
        }), 200
    except Exception as e:
        import traceback
        traceback.print_exc()
        logging.error(f"Error fetching doctors with availability: {str(e)}")
        return jsonify({
            "status": "error",
            "message": "Failed to fetch doctors",
            "error": str(e)
        }), 500

    data = request.get_json()
    doctor_id = data.get('doctor_id')
    date_str = data.get('date')  # Expecting format: 'YYYY-MM-DD'

    # Call your logic to fetch available time slots using the bitmap index
    available_slots = get_bitmap_available_slots(doctor_id, date_str)

    return jsonify({
        'status': 'success',
        'slots': available_slots  # e.g. ['09:00', '09:30', '10:00']
    }), 200

@patient_bp.route('/apt/timeslots', methods=['POST'])
@jwt_required()
def get_available_time_slots():
    data = request.get_json()
    doctor_id = data.get('doctor_id')
    selected_date = data.get('date')  # Format: YYYY-MM-DD

    if not doctor_id or not selected_date:
        return jsonify({"status": "error", "message": "Missing doctor or date"}), 400

    try:
        # Parse date and get day of week
        date_obj = datetime.strptime(selected_date, "%Y-%m-%d")
        day_name = date_obj.strftime("%A").lower()  # e.g., "monday"

        # Get doctor's availability for that day
        availability = DoctorAvailability.query.filter_by(
            doctor_id=doctor_id,
            day_of_week=day_name
        ).first()

        if not availability:
            return jsonify({"status": "success", "slots": []}), 200

        # Generate 30-min slots from start to end time
        start_time = availability.start_time
        end_time = availability.end_time

        slots = []
        current_time = datetime.combine(date_obj.date(), start_time)
        end_datetime = datetime.combine(date_obj.date(), end_time)

        while current_time + timedelta(minutes=30) <= end_datetime:
            slots.append(current_time.strftime("%H:%M"))
            current_time += timedelta(minutes=30)

        # Get already booked appointments on that day
        booked = Appointment.query.filter(
            Appointment.doctor_id == doctor_id,
            Appointment.status.in_(["pending", "confirmed"]),
            db.func.date(Appointment.created_at) == date_obj.date()
        ).all()

        booked_times = set([a.created_at.strftime("%H:%M") for a in booked])

        # Filter out booked slots
        available_slots = [slot for slot in slots if slot not in booked_times]

        return jsonify({"status": "success", "slots": available_slots}), 200

    except Exception as e:
        print("Error:", e)
        return jsonify({"status": "error", "message": "Internal error"}), 500

