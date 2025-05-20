
// Global variables for appointment booking
let selectedDoctor = null;
let selectedSlot = null;

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing patient dashboard');
    
    // Check if user is authenticated
    const token = localStorage.getItem('access_token');
    if (!token) {
        console.error('No access token found');
        window.location.href = '/patient/login';
        return;
    }
    
    // Initialize navigation
    initNavigation();
    
    // Load profile data
    loadProfileData();
    
    // Set up appointment booking only if the elements exist
    if (document.getElementById('doctorSelect')) {
        setupAppointmentBooking();
        // Add debug call
        debugFetchDoctors();
    }
    
    // Load appointments if on view appointments section
    if (document.getElementById('view-appointments-section')) {
        loadAppointments();
    }
    
    // Set up logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
});

// Initialize navigation between sections
function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-links a[data-section]');
    if (navLinks.length === 0) {
        console.log('No navigation links found with data-section attribute');
        return;
    }
    
    const sections = document.querySelectorAll('[id$="-section"]');
    if (sections.length === 0) {
        console.log('No sections found with -section suffix');
        return;
    }
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetSection = this.getAttribute('data-section');
            console.log(`Navigating to section: ${targetSection}`);
            
            // Hide all sections
            sections.forEach(section => {
                section.style.display = 'none';
            });
            
            // Show target section
            const targetElement = document.getElementById(targetSection + '-section');
            if (targetElement) {
                targetElement.style.display = 'block';
                
                // Load appointments when viewing that section
                if (targetSection === 'view-appointments') {
                    loadAppointments();
                }
            } else {
                console.error(`Target section not found: ${targetSection}-section`);
            }
            
            // Update active link
            navLinks.forEach(navLink => {
                navLink.parentElement.classList.remove('active');
            });
            this.parentElement.classList.add('active');
        });
    });
}

// Load and display profile data
function loadProfileData() {
    showLoader('profileLoader');
    
    fetch('/patient/profile', {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('access_token')
        }
    })
    .then(response => {
        if (response.status === 401) {
            // Unauthorized - token expired or invalid
            throw new Error('Unauthorized');
        }
        if (!response.ok) {
            throw new Error('Failed to fetch profile');
        }
        return response.json();
    })
    .then(data => {
        console.log("Profile data received:", data);
        hideLoader('profileLoader');
        
        if (data.status === 'success') {
            // Update profile display in header
            const nameElements = document.querySelectorAll('#labDisplayName, #patientDisplayName');
            nameElements.forEach(el => {
                if (el) el.textContent = data.data.fullname;
            });
            
            // Update profile modal if it exists
            const viewFullNameElement = document.getElementById('viewFullName');
            if (viewFullNameElement) viewFullNameElement.textContent = data.data.fullname;
            
            const viewEmailElement = document.getElementById('viewEmail');
            if (viewEmailElement) viewEmailElement.textContent = data.data.email;
            
            const viewPhoneElement = document.getElementById('viewPhone');
            if (viewPhoneElement) viewPhoneElement.textContent = data.data.phone_number;
            
            // Update additional profile fields if they exist
            const viewGenderElement = document.getElementById('viewGender');
            if (viewGenderElement && data.data.gender) {
                viewGenderElement.textContent = data.data.gender.charAt(0).toUpperCase() + data.data.gender.slice(1);
            }
            
            const viewBirthDateElement = document.getElementById('viewBirthDate');
            if (viewBirthDateElement && data.data.birth_date) {
                const birthDate = new Date(data.data.birth_date);
                viewBirthDateElement.textContent = birthDate.toLocaleDateString('en-US', {
                    year: 'numeric', month: 'long', day: 'numeric'
                });
            }
        }
    })
    .catch(error => {
        hideLoader('profileLoader');
        console.error('Error loading profile:', error);
        
        if (error.message === 'Unauthorized') {
            showAlert('error', 'Your session has expired. Please log in again.');
            logout();
        } else {
            showAlert('error', 'Failed to load profile. Please refresh the page.');
        }
    });
}

// Set up appointment booking functionality
function setupAppointmentBooking() {
    console.log('Setting up appointment booking');
    
    // Load doctors for appointment booking
    const doctorSelect = document.getElementById('doctorSelect');
    if (doctorSelect) {
        loadDoctors();
        
        // Add event listener for doctor selection
        doctorSelect.addEventListener('change', function() {
            if (this.value) {
                const selectedOption = this.options[this.selectedIndex];
                try {
                    selectedDoctor = JSON.parse(selectedOption.getAttribute('data-doctor'));
                    
                    // Enable next button
                    const nextBtn = document.getElementById('nextToStep2');
                    if (nextBtn) nextBtn.disabled = false;
                    
                    console.log('Selected doctor:', selectedDoctor);
                } catch (e) {
                    console.error('Error parsing doctor data:', e);
                }
            } else {
                selectedDoctor = null;
                
                // Disable next button
                const nextBtn = document.getElementById('nextToStep2');
                if (nextBtn) nextBtn.disabled = true;
            }
        });
    } else {
        console.error('Doctor select element not found');
    }
    
    // Set up step navigation buttons
    setupStepNavigation();
    
    // Set up appointment booking confirmation
    const confirmBtn = document.getElementById('confirmBooking');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', bookAppointment);
    }
}

// Load doctors for appointment booking
function loadDoctors() {
    const doctorSelect = document.getElementById('doctorSelect');
    if (!doctorSelect) {
        console.error('Doctor select element not found');
        return;
    }
    
    // Clear existing options
    doctorSelect.innerHTML = '<option value="">-- Select a Doctor --</option>';
    
    // Show loading in select
    const loadingOption = document.createElement('option');
    loadingOption.textContent = 'Loading doctors...';
    loadingOption.disabled = true;
    doctorSelect.appendChild(loadingOption);
    
    console.log('Fetching doctors from API...');
    
    // Get token from localStorage
    const token = localStorage.getItem('access_token');
    if (!token) {
        console.error('No access token found');
        doctorSelect.innerHTML = '<option value="">-- Select a Doctor --</option>';
        const errorOption = document.createElement('option');
        errorOption.textContent = 'Please log in again';
        errorOption.disabled = true;
        doctorSelect.appendChild(errorOption);
        return;
    }
    
    // Fetch doctors from API
    fetch('/patient/doctors/available', {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + token
        }
    })
    .then(response => {
        console.log('Response status:', response.status);
        if (response.status === 401) {
            throw new Error('Unauthorized');
        }
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Doctors data received:', data);
        
        // Remove loading option
        doctorSelect.innerHTML = '<option value="">-- Select a Doctor --</option>';
        
        if (data.status === 'success' && data.doctors && data.doctors.length > 0) {
            // Add doctors to select dropdown
            data.doctors.forEach(doctor => {
                const option = document.createElement('option');
                option.value = doctor.id;
                option.textContent = `${doctor.name} - ${doctor.specialty}`;
                option.setAttribute('data-doctor', JSON.stringify(doctor));
                doctorSelect.appendChild(option);
            });
            console.log(`Added ${data.doctors.length} doctors to dropdown`);
        } else {
            // No doctors found
            const noDocsOption = document.createElement('option');
            noDocsOption.textContent = 'No doctors available';
            noDocsOption.disabled = true;
            doctorSelect.appendChild(noDocsOption);
            console.warn('No doctors returned from API');
        }
    })
    .catch(error => {
        console.error('Error fetching doctors:', error);
        
        // Reset dropdown with error message
        doctorSelect.innerHTML = '<option value="">-- Select a Doctor --</option>';
        const errorOption = document.createElement('option');
        errorOption.textContent = 'Error loading doctors';
        errorOption.disabled = true;
        doctorSelect.appendChild(errorOption);
        
        // Show alert with more details
        showAlert('error', 'Failed to load doctors. Check console for details.');
        
        if (error.message === 'Unauthorized') {
            showAlert('error', 'Your session has expired. Please log in again.');
            logout();
        }
    });
}

// Set up step navigation for appointment booking
function setupStepNavigation() {
    console.log('Setting up step navigation');
    
    // Step 1 to Step 2
    const nextToStep2Btn = document.getElementById('nextToStep2');
    if (nextToStep2Btn) {
        nextToStep2Btn.addEventListener('click', function() {
            if (selectedDoctor) {
                // Update doctor name in step 2
                const doctorNameEl = document.getElementById('selectedDoctorName');
                if (doctorNameEl) {
                    doctorNameEl.textContent = selectedDoctor.name;
                }
                
                // Show step 2, hide step 1
                const step1 = document.getElementById('step1');
                const step2 = document.getElementById('step2');
                if (step1 && step2) {
                    step1.classList.remove('active');
                    step2.classList.add('active');
                    
                    // Update progress indicator
                    updateProgressIndicator(2);
                    
                    // Generate available time slots
                    generateTimeSlots();
                } else {
                    console.error('Step elements not found');
                }
            }
        });
    } else {
        console.log('Next to step 2 button not found');
    }
    
    // Step 2 to Step 3
    const nextToStep3Btn = document.getElementById('nextToStep3');
    if (nextToStep3Btn) {
        nextToStep3Btn.addEventListener('click', function() {
            if (selectedDoctor && selectedSlot) {
                // Fill confirmation details
                const confirmDoctorName = document.getElementById('confirmDoctorName');
                if (confirmDoctorName) {
                    confirmDoctorName.textContent = selectedDoctor.name;
                }
                
                const confirmSpecialty = document.getElementById('confirmSpecialty');
                if (confirmSpecialty) {
                    confirmSpecialty.textContent = selectedDoctor.specialty;
                }
                
                const confirmDate = document.getElementById('confirmDate');
                if (confirmDate) {
                    // Format date for better readability
                    const date = new Date(selectedSlot.date);
                    confirmDate.textContent = date.toLocaleDateString('en-US', {
                        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                    });
                }
                
                const confirmTime = document.getElementById('confirmTime');
                if (confirmTime) {
                    confirmTime.textContent = selectedSlot.display;
                }
                
                // Show step 3, hide step 2
                const step2 = document.getElementById('step2');
                const step3 = document.getElementById('step3');
                if (step2 && step3) {
                    step2.classList.remove('active');
                    step3.classList.add('active');
                    
                    // Update progress indicator
                    updateProgressIndicator(3);
                }
            }
        });
    }
    
    // Back buttons
    const backButtons = document.querySelectorAll('.btn-back');
    backButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const currentStep = parseInt(this.getAttribute('data-current-step'));
            const prevStep = currentStep - 1;
            
            // Hide current step, show previous step
            const currentStepEl = document.getElementById(`step${currentStep}`);
            const prevStepEl = document.getElementById(`step${prevStep}`);
            
            if (currentStepEl && prevStepEl) {
                currentStepEl.classList.remove('active');
                prevStepEl.classList.add('active');
                
                // Update progress indicator
                updateProgressIndicator(prevStep);
            }
        });
    });
}

// Update progress indicator
function updateProgressIndicator(step) {
    // Reset all steps
    document.querySelectorAll('.progress-steps .step').forEach((el, index) => {
        if (index + 1 <= step) {
            el.classList.add('active');
        } else {
            el.classList.remove('active');
        }
    });
}

// Generate available time slots based on doctor's schedule
function generateTimeSlots() {
    const dateInput = document.getElementById('availableDate');
    const timeSelect = document.getElementById('availableTime');
    
    if (!dateInput || !timeSelect || !selectedDoctor) {
        console.error('Date, time elements, or selected doctor not found');
        return;
    }
    
    // Enable date selection
    dateInput.disabled = false;
    
    // Set min date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    dateInput.min = tomorrow.toISOString().split('T')[0];
    
    // Set max date to 30 days from now
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    dateInput.max = maxDate.toISOString().split('T')[0];
    
    // Add event listener for date selection
    dateInput.addEventListener('change', function() {
        // Get selected date
        const selectedDate = new Date(this.value);
        const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][selectedDate.getDay()];
        
        // Clear existing options
        timeSelect.innerHTML = '<option value="">-- Select a Time --</option>';
        
        // Check if doctor has availability for this day
        if (!selectedDoctor.availability || selectedDoctor.availability.length === 0) {
            // If no availability data, use default hours (9 AM to 5 PM)
            timeSelect.disabled = false;
            
            for (let hour = 9; hour < 17; hour++) {
                for (let minute of [0, 30]) {
                    const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                    const option = document.createElement('option');
                    option.value = timeStr;
                    
                    // Format for display (12-hour format)
                    const displayHour = hour % 12 || 12;
                    const ampm = hour < 12 ? 'AM' : 'PM';
                    option.textContent = `${displayHour}:${minute.toString().padStart(2, '0')} ${ampm}`;
                    
                    timeSelect.appendChild(option);
                }
            }
        } else {
            // Find availability for this day
            const dayAvailability = selectedDoctor.availability.find(a => a.day.toLowerCase() === dayOfWeek.toLowerCase());
            
            if (!dayAvailability) {
                const noSlotsOption = document.createElement('option');
                noSlotsOption.textContent = `Doctor not available on ${dayOfWeek}`;
                noSlotsOption.disabled = true;
                timeSelect.appendChild(noSlotsOption);
                timeSelect.disabled = true;
                return;
            }
            
            // Enable time selection
            timeSelect.disabled = false;
            
            // Generate time slots based on doctor's schedule
            const startTime = dayAvailability.start_time.split(':');
            const endTime = dayAvailability.end_time.split(':');
            
            const startHour = parseInt(startTime[0]);
            const startMinute = parseInt(startTime[1]);
            const endHour = parseInt(endTime[0]);
            const endMinute = parseInt(endTime[1]);
            
            // Generate 30-minute slots
            for (let hour = startHour; hour <= endHour; hour++) {
                for (let minute of [0, 30]) {
                    // Skip times before start time or after end time
                    if (hour === startHour && minute < startMinute) continue;
                    if (hour === endHour && minute >= endMinute) continue;
                    
                    const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                    const option = document.createElement('option');
                    option.value = timeStr;
                    
                    // Format for display (12-hour format)
                    const displayHour = hour % 12 || 12;
                    const ampm = hour < 12 ? 'AM' : 'PM';
                    option.textContent = `${displayHour}:${minute.toString().padStart(2, '0')} ${ampm}`;
                    
                    timeSelect.appendChild(option);
                }
            }
        }
        
        // Add event listener for time selection
        timeSelect.addEventListener('change', function() {
            if (this.value) {
                selectedSlot = {
                    date: dateInput.value,
                    time: this.value,
                    display: this.options[this.selectedIndex].textContent
                };
                
                // Enable next button
                const nextBtn = document.getElementById('nextToStep3');
                if (nextBtn) nextBtn.disabled = false;
            } else {
                selectedSlot = null;
                
                // Disable next button
                const nextBtn = document.getElementById('nextToStep3');
                if (nextBtn) nextBtn.disabled = true;
            }
        });
    });
}

// Book appointment
function bookAppointment() {
    console.log('Booking appointment...');
    
    if (!selectedDoctor || !selectedSlot) {
        showAlert('error', 'Please select a doctor and time slot');
        return;
    }
    
    // Disable confirm button to prevent double booking
    const confirmBtn = document.getElementById('confirmBooking');
    if (confirmBtn) {
        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Booking...';
    }
    
    // Format the appointment data according to what the backend expects
    const appointmentData = {
        doctor_name: selectedDoctor.name,
        medical_specialty: selectedDoctor.specialty,
        date: selectedSlot.date,
        time: selectedSlot.time
    };
    
    console.log('Booking appointment with data:', appointmentData);
    
    fetch('/patient/apt/book', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + localStorage.getItem('access_token')
        },
        body: JSON.stringify(appointmentData)
    })
    .then(response => {
        if (response.status === 401) {
            throw new Error('Unauthorized');
        }
        return response.json();
    })
    .then(data => {
        console.log('Booking response:', data);
        
        // Re-enable confirm button
        if (confirmBtn) {
            confirmBtn.disabled = false;
            confirmBtn.textContent = 'Confirm Booking';
        }
        
        if (data.status === 'success') {
            showAlert('success', data.message || 'Appointment booked successfully');
            
            // Reset form and selected values
            selectedDoctor = null;
            selectedSlot = null;
            
            // Reset the booking form UI
            resetBookingForm();
            
            // Switch to view appointments section
            const viewApptsLink = document.querySelector('a[data-section="view-appointments"]');
            if (viewApptsLink) {
                viewApptsLink.click();
            }
        } else {
            showAlert('error', data.message || 'Error booking appointment');
        }
    })
    .catch(error => {
        console.error('Error booking appointment:', error);
        
        // Re-enable confirm button
        if (confirmBtn) {
            confirmBtn.disabled = false;
            confirmBtn.textContent = 'Confirm Booking';
        }
        
        if (error.message === 'Unauthorized') {
            showAlert('error', 'Your session has expired. Please log in again.');
            logout();
        } else {
            showAlert('error', 'Failed to book appointment. Please try again.');
        }
    });
}

// Function to reset the booking form
function resetBookingForm() {
    // Reset doctor selection
    const doctorSelect = document.getElementById('doctorSelect');
    if (doctorSelect) {
        doctorSelect.selectedIndex = 0;
    }
    
    // Clear selected time slot
    const timeSlots = document.querySelectorAll('.time-slot');
    timeSlots.forEach(slot => {
        slot.classList.remove('selected');
    });
    
    // Reset to step 1
    const steps = document.querySelectorAll('.booking-step');
    steps.forEach(step => {
        step.classList.remove('active');
    });
    
    const step1 = document.getElementById('step1');
    if (step1) {
        step1.classList.add('active');
    }
    
    // Reset progress indicator
    updateProgressIndicator(1);
    
    // Reset global variables
    selectedDoctor = null;
    selectedSlot = null;
}

// Load appointments
function loadAppointments() {
    console.log('Loading appointments');
    const appointmentsContainer = document.getElementById('appointments-container');
    if (!appointmentsContainer) {
        console.error('Appointments container not found');
        return;
    }
    
    // Show loading spinner
    appointmentsContainer.innerHTML = `
        <div class="text-center p-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-2">Loading your appointments...</p>
        </div>
    `;
    
    fetch('/patient/apt/list', {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('access_token')
        }
    })
    .then(response => {
        if (response.status === 401) {
            throw new Error('Unauthorized');
        }
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Appointments data:', data);
        
        if (data.status === 'success' && data.appointments && data.appointments.length > 0) {
            // Render appointments
            let html = `
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>Doctor</th>
                                <th>Specialty</th>
                                <th>Date</th>
                                <th>Time</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            data.appointments.forEach(apt => {
                // Format date
                const date = new Date(apt.date);
                const formattedDate = date.toLocaleDateString('en-US', {
                    year: 'numeric', month: 'long', day: 'numeric'
                });
                
                // Format time
                const timeParts = apt.time.split(':');
                const hour = parseInt(timeParts[0]);
                const minute = timeParts[1];
                const ampm = hour >= 12 ? 'PM' : 'AM';
                const hour12 = hour % 12 || 12;
                const formattedTime = `${hour12}:${minute} ${ampm}`;
                
                // Status badge class
                let statusClass = '';
                switch (apt.status.toLowerCase()) {
                    case 'pending':
                        statusClass = 'bg-warning text-dark';
                        break;
                    case 'confirmed':
                        statusClass = 'bg-success';
                        break;
                    case 'completed':
                        statusClass = 'bg-info';
                        break;
                    case 'cancelled':
                        statusClass = 'bg-danger';
                        break;
                    default:
                        statusClass = 'bg-secondary';
                }
                
                // Cancel button (only show for pending or confirmed appointments)
                const cancelButton = (apt.status.toLowerCase() === 'pending' || apt.status.toLowerCase() === 'confirmed') 
                    ? `<button class="btn btn-sm btn-outline-danger cancel-apt" data-apt-id="${apt.id}">Cancel</button>` 
                    : '';
                
                html += `
                    <tr>
                        <td>${apt.doctor_name}</td>
                        <td>${apt.doctor_specialty}</td>
                        <td>${formattedDate}</td>
                        <td>${formattedTime}</td>
                        <td><span class="badge ${statusClass}">${apt.status}</span></td>
                        <td>${cancelButton}</td>
                    </tr>
                `;
            });
            
            html += `
                        </tbody>
                    </table>
                </div>
            `;
            
            appointmentsContainer.innerHTML = html;
            
            // Add event listeners to cancel buttons
            const cancelButtons = document.querySelectorAll('.cancel-apt');
            cancelButtons.forEach(btn => {
                btn.addEventListener('click', function() {
                    const aptId = this.getAttribute('data-apt-id');
                    cancelAppointment(aptId);
                });
            });
        } else {
            // No appointments
            appointmentsContainer.innerHTML = `
                <div class="text-center p-5">
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle me-2"></i>
                        You don't have any appointments yet.
                    </div>
                    <button class="btn btn-primary mt-3" id="bookNewAppointmentBtn">
                        <i class="fas fa-calendar-plus me-2"></i>
                        Book an Appointment
                    </button>
                </div>
            `;
            
            // Add event listener to book button
            const bookBtn = document.getElementById('bookNewAppointmentBtn');
            if (bookBtn) {
                bookBtn.addEventListener('click', function() {
                    // Navigate to book appointment section
                    const bookLink = document.querySelector('a[data-section="book-appointment"]');
                    if (bookLink) {
                        bookLink.click();
                    }
                });
            }
        }
    })
    .catch(error => {
        console.error('Error loading appointments:', error);
        
        appointmentsContainer.innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-triangle me-2"></i>
                Failed to load appointments. ${error.message}
            </div>
            <button class="btn btn-primary mt-3" id="retryLoadAppointmentsBtn">
                <i class="fas fa-sync me-2"></i>
                Retry
            </button>
        `;
        
        // Add event listener to retry button
        const retryBtn = document.getElementById('retryLoadAppointmentsBtn');
        if (retryBtn) {
            retryBtn.addEventListener('click', loadAppointments);
        }
        
        if (error.message === 'Unauthorized') {
            showAlert('error', 'Your session has expired. Please log in again.');
            logout();
        }
    });
}

// Cancel appointment
function cancelAppointment(appointmentId) {
    if (!confirm('Are you sure you want to cancel this appointment?')) {
        return;
    }
    
    fetch(`/patient/apt/cancel/${appointmentId}`, {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('access_token')
        }
    })
    .then(response => {
        if (response.status === 401) {
            throw new Error('Unauthorized');
        }
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Cancel response:', data);
        
        if (data.status === 'success') {
            showAlert('success', 'Appointment cancelled successfully');
            // Reload appointments
            loadAppointments();
        } else {
            showAlert('error', data.message || 'Failed to cancel appointment');
        }
    })
    .catch(error => {
        console.error('Error cancelling appointment:', error);
        
        if (error.message === 'Unauthorized') {
            showAlert('error', 'Your session has expired. Please log in again.');
            logout();
        } else {
            showAlert('error', 'Failed to cancel appointment. Please try again.');
        }
    });
}

// Close view modal
function closeViewModal() {
const modal = document.getElementById('viewProfileModal');
modal.style.opacity = '0';
modal.style.transform = 'translateY(-20px)';
setTimeout(() => {
    modal.style.display = 'none';
}, 300);
}

// Book appointment - Step 3 confirmation button
document.getElementById('confirmBooking').addEventListener('click', function() {
    // Get selected doctor and time slot from the form
    const appointmentData = {
        doctor_name: selectedDoctor.name,
        medical_specialty: selectedDoctor.specialty,
        date: selectedSlot.start.toISOString().split('T')[0],
        time: selectedSlot.start.toTimeString().substring(0, 5)
    };

    // Call the API to book the appointment
    fetch('/patient/apt/book', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + localStorage.getItem('access_token')
        },
        body: JSON.stringify(appointmentData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            alert(data.message);
            resetForm();
            // Switch to View Appointments section
            document.querySelector('a[data-section="view-appointments"]').click();
            loadAppointments(); // Refresh appointments list
        } else {
            alert('Error: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error booking appointment:', error);
        alert('Failed to book appointment. Please try again.');
    });
});

// Function to load appointments
function loadAppointments() {
    fetch('/patient/apt/view', {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('access_token')
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            const tbody = document.getElementById('appointmentsBody');
            tbody.innerHTML = ''; // Clear existing rows
            
            data.appointments.forEach(apt => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${apt.doctor_name} (${apt.specialty})</td>
                    <td>${apt.date}</td>
                    <td>${apt.time_range}</td>
                    <td>${apt.status}</td>
                    <td>
                        <button class="btn-cancel" onclick="cancelAppointment(${apt.appointment_id})">
                            Cancel
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
    })
    .catch(error => {
        console.error('Error loading appointments:', error);
    });
}

// Function to cancel an appointment
function cancelAppointment(appointmentId) {
    if (confirm('Are you sure you want to cancel this appointment?')) {
        fetch(`/patient/apt/cancel/${appointmentId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('access_token')
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                alert(data.message);
                loadAppointments(); // Refresh the appointments list
            } else {
                alert('Error: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error cancelling appointment:', error);
            alert('Failed to cancel appointment. Please try again.');
        });
    }
}

// Load appointments when view appointments section is shown
document.querySelector('a[data-section="view-appointments"]').addEventListener('click', function() {
    loadAppointments();
});

// Also load appointments when page loads if we're on the view appointments section
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('view-appointments-section').style.display !== 'none') {
        loadAppointments();
    }

// Helper function to show alerts
function showAlert(type, message) {
    // Create alert element if it doesn't exist
    let alertContainer = document.getElementById('alertContainer');
    if (!alertContainer) {
        alertContainer = document.createElement('div');
        alertContainer.id = 'alertContainer';
        alertContainer.style.position = 'fixed';
        alertContainer.style.top = '20px';
        alertContainer.style.right = '20px';
        alertContainer.style.zIndex = '1000';
        document.body.appendChild(alertContainer);
    }
    
    // Create alert
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.innerHTML = `
        <span>${message}</span>
        <button type="button" class="close-btn">&times;</button>
    `;
    
    // Style based on type
    if (type === 'error') {
        alert.style.backgroundColor = '#f8d7da';
        alert.style.color = '#721c24';
        alert.style.borderColor = '#f5c6cb';
    } else if (type === 'success') {
        alert.style.backgroundColor = '#d4edda';
        alert.style.color = '#155724';
        alert.style.borderColor = '#c3e6cb';
    } else {
        alert.style.backgroundColor = '#cce5ff';
        alert.style.color = '#004085';
        alert.style.borderColor = '#b8daff';
    }
    
    // Additional styling
    alert.style.padding = '10px 15px';
    alert.style.marginBottom = '10px';
    alert.style.borderRadius = '4px';
    alert.style.border = '1px solid transparent';
    
    // Add close button functionality
    const closeBtn = alert.querySelector('.close-btn');
    closeBtn.style.marginLeft = '15px';
    closeBtn.style.fontWeight = 'bold';
    closeBtn.style.float = 'right';
    closeBtn.style.fontSize = '20px';
    closeBtn.style.lineHeight = '20px';
    closeBtn.style.cursor = 'pointer';
    
    closeBtn.addEventListener('click', function() {
        alertContainer.removeChild(alert);
    });
    
    // Add to container
    alertContainer.appendChild(alert);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (alertContainer.contains(alert)) {
            alertContainer.removeChild(alert);
        }
    }, 5000);
}

// Helper function to show loader
function showLoader(id) {
    const loaderContainer = document.getElementById(id);
    if (!loaderContainer) return;
    
    loaderContainer.innerHTML = `
        <div class="loader-spinner"></div>
        <p>Loading...</p>
    `;
    loaderContainer.style.display = 'flex';
}

// Helper function to hide loader
function hideLoader(id) {
    const loaderContainer = document.getElementById(id);
    if (!loaderContainer) return;
    
    loaderContainer.innerHTML = '';
    loaderContainer.style.display = 'none';
}

// Logout function
function logout() {
    console.log('Logging out...');
    // Clear local storage
    localStorage.removeItem('access_token');
    
    // Redirect to login page
    window.location.href = '/patient/login?session_expired=true';
}

// Helper function to parse time string (HH:MM) to Date object
function parseTime(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
}

// Helper function to format Date as time string (HH:MM)
function formatTime(date) {
    return date.toTimeString().substring(0, 5);
}

// Add event listener for date input
document.addEventListener('DOMContentLoaded', function() {
    const dateInput = document.getElementById('appointmentDate');
    if (dateInput) {
        dateInput.addEventListener('change', function() {
            if (selectedDoctor) {
                generateTimeSlots();
            }
        });
        
        // Set min date to today
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        dateInput.min = `${yyyy}-${mm}-${dd}`;
    }

// Doctor selection handling
document.addEventListener('DOMContentLoaded', function() {
    const doctorSelect = document.getElementById('doctorSelect');
    const nextToStep2Btn = document.getElementById('nextToStep2');
    
    if (doctorSelect) {
        // Load doctors into dropdown
        loadDoctors();
        
        // Enable next button when a doctor is selected
        doctorSelect.addEventListener('change', function() {
            if (this.value) {
                nextToStep2Btn.disabled = false;
            } else {
                nextToStep2Btn.disabled = true;
            }
        });
    }
    
    // Handle dropdown display
    doctorSelect.addEventListener('click', function(e) {
        e.stopPropagation();
        
        // Check if dropdown is already open
        const existingList = document.querySelector('.doctor-list');
        if (existingList) {
            existingList.remove();
            return;
        }
        
        // Create dropdown list
        const doctorList = document.createElement('div');
        doctorList.className = 'doctor-list';
        
        // Get all options from select
        const options = Array.from(this.options);
        
        // Skip the first placeholder option
        options.slice(1).forEach(option => {
            const item = document.createElement('div');
            item.className = 'doctor-list-item';
            item.textContent = option.textContent;
            item.setAttribute('data-value', option.value);
            
            item.addEventListener('click', function() {
                doctorSelect.value = this.getAttribute('data-value');
                doctorSelect.dispatchEvent(new Event('change'));
                doctorList.remove();
            });
            
            doctorList.appendChild(item);
        });
        
        // Position and append the dropdown
        const rect = this.getBoundingClientRect();
        doctorList.style.top = `${rect.bottom}px`;
        doctorList.style.left = `${rect.left}px`;
        doctorList.style.width = `${rect.width}px`;
        
        document.body.appendChild(doctorList);
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function() {
        const doctorList = document.querySelector('.doctor-list');
        if (doctorList) {
            doctorList.remove();
        }
    });
});

// Function to load doctors
function loadDoctors() {
    const doctorSelect = document.getElementById('doctorSelect');
    if (!doctorSelect) return;
    
    // Clear existing options except the first one
    while (doctorSelect.options.length > 1) {
        doctorSelect.remove(1);
    }
    
    // Add sample doctors (replace with your API call)
    const sampleDoctors = [
        { id: 1, name: 'Dr. amira', specialty: 'Cardiologist' },
        { id: 2, name: 'Dr. fatima', specialty: 'Neurologist' }
    ];
    
    sampleDoctors.forEach(doctor => {
        const option = document.createElement('option');
        option.value = doctor.id;
        option.textContent = `${doctor.name} - ${doctor.specialty}`;
        doctorSelect.appendChild(option);
    });
}

// Function to update progress indicator
function updateProgressIndicator(step) {
    // Reset all steps
    document.querySelectorAll('.progress-steps .step').forEach((el, index) => {
        if (index + 1 <= step) {
            el.classList.add('active');
        } else {
            el.classList.remove('active');
        }
    });
}

// Doctor selection change handler
document.getElementById('doctorSelect').addEventListener('change', function() {
    const selectedOption = this.options[this.selectedIndex];
    const nextButton = document.getElementById('nextToStep2');
    const doctorDetails = document.getElementById('doctorDetails');
    
    if (this.value) {
        // Enable next button
        nextButton.disabled = false;
        
        // Get doctor data from the selected option
        try {
            selectedDoctor = JSON.parse(selectedOption.getAttribute('data-doctor'));
            console.log('Selected doctor:', selectedDoctor);
            
            // Update doctor details display
            document.getElementById('selectedDoctorName').textContent = `Dr. ${selectedDoctor.name}`;
            document.getElementById('selectedDoctorSpecialty').textContent = selectedDoctor.specialty;
            doctorDetails.style.display = 'block';
        } catch (e) {
            console.error('Error parsing doctor data:', e);
            nextButton.disabled = true;
            doctorDetails.style.display = 'none';
        }
    } else {
        // Disable next button
        nextButton.disabled = true;
        doctorDetails.style.display = 'none';
    }
});

// Step navigation buttons
document.getElementById('nextToStep2').addEventListener('click', function() {
    // Hide step 1, show step 2
    document.getElementById('step1').classList.remove('active');
    document.getElementById('step2').classList.add('active');
    
    // Update progress indicator
    updateProgressIndicator(2);
    
    // Enable date selection
    document.getElementById('appointmentDate').disabled = false;
});

document.getElementById('backToStep1').addEventListener('click', function() {
    // Hide step 2, show step 1
    document.getElementById('step2').classList.remove('active');
    document.getElementById('step1').classList.add('active');
    
    // Update progress indicator
    updateProgressIndicator(1);
});

document.getElementById('nextToStep3').addEventListener('click', function() {
    // Hide step 2, show step 3
    document.getElementById('step2').classList.remove('active');
    document.getElementById('step3').classList.add('active');
    
    // Update progress indicator
    updateProgressIndicator(3);
    
    // Update confirmation details
    document.getElementById('confirmDoctorName').textContent = `Dr. ${selectedDoctor.name}`;
    document.getElementById('confirmSpecialty').textContent = selectedDoctor.specialty;
    
    const dateObj = new Date(document.getElementById('appointmentDate').value);
    const formattedDate = dateObj.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    document.getElementById('confirmDate').textContent = formattedDate;
    document.getElementById('confirmTime').textContent = selectedSlot.display;
});

document.getElementById('backToStep2').addEventListener('click', function() {
    // Hide step 3, show step 2
    document.getElementById('step3').classList.remove('active');
    document.getElementById('step2').classList.add('active');
    
    // Update progress indicator
    updateProgressIndicator(2);
});

// Confirm booking button
document.getElementById('confirmBooking').addEventListener('click', function() {
    bookAppointment();
});

// Initialize the booking form when the page loads
document.addEventListener('DOMContentLoaded', function() {
    // Load available doctors
    loadDoctors();
    
    // Set min date to today for the date picker
    const dateInput = document.getElementById('appointmentDate');
    if (dateInput) {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        dateInput.min = `${yyyy}-${mm}-${dd}`;
        
        // Add event listener for date change
        dateInput.addEventListener('change', function() {
            if (selectedDoctor) {
                generateTimeSlots();
            }
        });
    }

// Add this function to help with debugging
function debugFetchDoctors() {
    // Get token from localStorage
    const token = localStorage.getItem('access_token');
    if (!token) {
        console.error('No access token found for debugging');
        return;
    }
    
    console.log('Debug: Manually fetching doctors...');
    
    // Make a direct fetch request to check the response
    fetch('/patient/doctors/available', {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + token
        }
    })
    .then(response => {
        console.log('Debug: Response status:', response.status);
        console.log('Debug: Response headers:', response.headers);
        return response.text(); // Get raw response text first
    })
    .then(text => {
        console.log('Debug: Raw response:', text);
        try {
            // Try to parse as JSON
            const data = JSON.parse(text);
            console.log('Debug: Parsed JSON:', data);
        } catch (e) {
            console.error('Debug: Failed to parse response as JSON:', e);
        }
    })
    .catch(error => {
        console.error('Debug: Error in fetch:', error);
    });
}

// Call this function when the page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing patient dashboard');
    
    // Check if user is authenticated
    const token = localStorage.getItem('access_token');
    if (!token) {
        console.error('No access token found');
        window.location.href = '/patient/login';
        return;
    }
    
    // Initialize navigation
    initNavigation();
    
    // Load profile data
    loadProfileData();
    
    // Set up appointment booking only if the elements exist
    if (document.getElementById('doctorSelect')) {
        setupAppointmentBooking();
        // Add debug call
        debugFetchDoctors();
    }
    
    // Load appointments if on view appointments section
    if (document.getElementById('view-appointments-section')) {
        loadAppointments();
    }

