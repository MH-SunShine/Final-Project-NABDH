        // Add this function to fetch and display profile data
        function loadProfileData() {
            const token = localStorage.getItem('access_token');
            if (!token) {
                window.location.href = "/patient/login";
                return;
            }
            
            fetch('/patient/profile', {
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch profile');
                }
                return response.json();
            })
            .then(data => {
                console.log("Profile data received:", data); // Debug log
                if (data.status === 'success') {
                    // Update profile display
                    document.getElementById('labDisplayName').textContent = data.data.fullname;
                    document.getElementById('patientDisplayName').textContent = data.data.fullname;
                    
                    // Update profile modal if it exists
                    const viewFullNameElement = document.getElementById('viewFullName');
                    if (viewFullNameElement) viewFullNameElement.textContent = data.data.fullname;
                    
                    const viewEmailElement = document.getElementById('viewEmail');
                    if (viewEmailElement) viewEmailElement.textContent = data.data.email;
                    
                    const viewPhoneElement = document.getElementById('viewPhone');
                    if (viewPhoneElement) viewPhoneElement.textContent = data.data.phone_number;
                    
                    // Add birth date and gender
                    const viewBirthDateElement = document.getElementById('viewBirthDate');
                    if (viewBirthDateElement) {
                        // Format the date for better display
                        const birthDate = new Date(data.data.birth_date);
                        const formattedDate = birthDate.toLocaleDateString('en-US', {
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric'
                        });
                        viewBirthDateElement.textContent = formattedDate;
                    }
                    
                    const viewGenderElement = document.getElementById('viewGender');
                    if (viewGenderElement) {
                        // Capitalize first letter of gender
                        const gender = data.data.gender.charAt(0).toUpperCase() + data.data.gender.slice(1);
                        viewGenderElement.textContent = gender;
                    }
                }
            })
            .catch(error => {
                console.error('Error loading profile:', error);
            });
        }

        // Call this function when the page loads
        document.addEventListener('DOMContentLoaded', loadProfileData);

        function logout(event) {
            if (event) {
                event.preventDefault(); // Prevent default link behavior
            }
            
            console.log("Logout function called"); // Debug log
            
            // Clear the JWT token from localStorage
            localStorage.removeItem("access_token");
            localStorage.removeItem("user_type");
            
            // Redirect to the patient login page directly
            window.location.href = "/patient/login";
        }

        // Make sure profile dropdown toggle works
        function toggleProfileDropdown(event) {
            event.stopPropagation();
            const dropdown = document.querySelector('.profile-dropdown');
            dropdown.classList.toggle('active');
        }

        // Close dropdown when clicking outside
        document.addEventListener('click', function(event) {
            const dropdown = document.querySelector('.profile-dropdown');
            if (dropdown && !event.target.closest('.user-profile-wrapper')) {
                dropdown.classList.remove('active');
            }
        });

    
// Global variables
let selectedDoctor = null;
let selectedSlot = null;
let calendar = null;

// Save and show appointment
function saveAndShowAppointment() {
    if (!selectedDoctor || !selectedSlot) {
        alert('Please complete all steps before confirming.');
        return;
    }

    // Prepare appointment data
    const appointmentData = {
        doctorId: selectedDoctor.id,
        doctorName: selectedDoctor.name,
        startTime: selectedSlot.start,
        endTime: selectedSlot.end,
        date: document.getElementById('confirmDate').textContent,
        time: document.getElementById('confirmTime').textContent,
        status: 'confirmed'
    };

    // Save to localStorage
    const appointments = JSON.parse(localStorage.getItem('patientAppointments') || '[]');
    appointments.push(appointmentData);
    localStorage.setItem('patientAppointments', JSON.stringify(appointments));

    // Show success message
    alert('Appointment confirmed successfully!');

    // Load appointments and show view appointments section
    loadAppointments();
    document.querySelectorAll('.dashboard-content').forEach(el => el.style.display = 'none');
    document.getElementById('view-appointments-section').style.display = 'block';

    // Reset form
    resetForm();
    steps.goTo(1);
}

// Load appointments from storage
function loadAppointments() {
    const appointments = JSON.parse(localStorage.getItem('patientAppointments') || '[]');
    const tableBody = document.getElementById('appointmentsTableBody');
    tableBody.innerHTML = '';

    appointments.forEach(appointment => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${appointment.doctorName}</td>
            <td>${appointment.date}</td>
            <td>${appointment.time}</td>
            <td>${appointment.status}</td>
            <td>
                <button class="btn-cancel" onclick="cancelAppointment('${appointment.startTime}')">Cancel</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Cancel appointment
function cancelAppointment(appointmentTime) {
    if (confirm('Are you sure you want to cancel this appointment?')) {
        const appointments = JSON.parse(localStorage.getItem('patientAppointments') || '[]');
        const updatedAppointments = appointments.filter(app => app.startTime !== appointmentTime);
        localStorage.setItem('patientAppointments', JSON.stringify(updatedAppointments));
        loadAppointments();
    }
}

// Global variables

// Sample doctor data - in a real app, this would come from the backend
const doctors = [
    { 
        id: 1, 
        name: 'ameur mohamed', 
        specialty: 'generale medecine', 
        available: true,
        email: "mohamed@gmail.com",
        phone: "0765439843"
    }
];

// Initialize the form when the page loads
document.addEventListener('DOMContentLoaded', function() {
    // Load doctors
    loadDoctors();
    
    // Initialize the calendar
    initializeCalendar();
    
    // Set up event listeners
    document.getElementById('nextToStep2').addEventListener('click', nextStep);
    document.getElementById('nextToStep3').addEventListener('click', function() {
        // Fill summary in Step 3
        if (selectedDoctor && selectedSlot) {
            document.getElementById('confirmDoctorName').textContent = selectedDoctor.name;
            const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            document.getElementById('confirmDate').textContent = selectedSlot.start.toLocaleDateString('en-US', dateOptions);
            document.getElementById('confirmTime').textContent = `${selectedSlot.start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - ${selectedSlot.end.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
        }
        nextStep();
    });

    // Back button in Step 3 returns to Step 2 and keeps previous selections
    document.querySelector('#step3 .btn-back').addEventListener('click', function() {
        steps.goTo(2);
        // Re-populate date and time fields with previous selection
        if (selectedSlot) {
            document.getElementById('availableDate').value = selectedSlot.start.toISOString().split('T')[0];
            const availableTimeSelect = document.getElementById('availableTime');
            for (let opt of availableTimeSelect.options) {
                if (opt.value.startsWith(selectedSlot.start.toISOString())) {
                    availableTimeSelect.value = opt.value;
                    break;
                }
            }
        }
    });

    // Add click handlers for step navigation in the progress bar
    document.querySelectorAll('.step').forEach(stepEl => {
        stepEl.addEventListener('click', () => {
            const step = parseInt(stepEl.getAttribute('data-step'));
            steps.goTo(step);
        });
    });

    // Doctor select event: only enable Next button, do not show doctor card
    document.getElementById('doctorSelect').addEventListener('change', function() {
        const selectedOption = this.options[this.selectedIndex];
        if (this.value) {
            const doctor = JSON.parse(selectedOption.getAttribute('data-doctor'));
            selectedDoctor = doctor;
            document.getElementById('nextToStep2').disabled = false;
        } else {
            selectedDoctor = null;
            document.getElementById('nextToStep2').disabled = true;
        }
    });

    // When "Next" to Step 2 is clicked
    document.getElementById('nextToStep2').addEventListener('click', function() {
        if (selectedDoctor) {
            document.getElementById('selectedDoctorName').textContent = selectedDoctor.name || '';
            // Generate available slots for this doctor
            const slots = generateAvailableSlots(selectedDoctor.id);
            // Group slots by date
            const dateMap = {};
            slots.forEach(slot => {
                const dateStr = slot.start.toISOString().split('T')[0];
                if (!dateMap[dateStr]) dateMap[dateStr] = [];
                dateMap[dateStr].push(slot);
            });
            // Populate date picker with only available dates
            const availableDateInput = document.getElementById('availableDate');
            availableDateInput.value = '';
            availableDateInput.disabled = false;
            availableDateInput.setAttribute('min', Object.keys(dateMap)[0] || '');
            availableDateInput.setAttribute('max', Object.keys(dateMap).slice(-1)[0] || '');
            // Remove previous event listener if any
            availableDateInput.oninput = null;
            // Disable and reset time dropdown
            const availableTimeSelect = document.getElementById('availableTime');
            availableTimeSelect.innerHTML = '<option value="">-- Select a Time --</option>';
            availableTimeSelect.disabled = true;
            document.getElementById('nextToStep3').disabled = true;

            // Only allow picking available dates
            availableDateInput.oninput = function() {
                const selectedDate = this.value;
                availableTimeSelect.innerHTML = '<option value="">-- Select a Time --</option>';
                availableTimeSelect.disabled = true;
                document.getElementById('nextToStep3').disabled = true;
                if (dateMap[selectedDate]) {
                    dateMap[selectedDate].forEach(slot => {
                        const start = new Date(slot.start);
                        const end = new Date(slot.end);
                        const timeStr = `${start.getHours().toString().padStart(2, '0')}:${start.getMinutes().toString().padStart(2, '0')} - ${end.getHours().toString().padStart(2, '0')}:${end.getMinutes().toString().padStart(2, '0')}`;
                        const opt = document.createElement('option');
                        opt.value = `${slot.start.toISOString()}|${slot.end.toISOString()}`;
                        opt.textContent = timeStr;
                        availableTimeSelect.appendChild(opt);
                    });
                    availableTimeSelect.disabled = false;
                }
            };

            // Enable Next button only when a time is selected
            availableTimeSelect.onchange = function() {
                document.getElementById('nextToStep3').disabled = !this.value;
                if (this.value) {
                    const [startIso, endIso] = this.value.split('|');
                    selectedSlot = {
                        start: new Date(startIso),
                        end: new Date(endIso)
                    };
                } else {
                    selectedSlot = null;
                }
            };
        }
    });
});

// Load doctors into the select dropdown
function loadDoctors() {
    const doctorSelect = document.getElementById('doctorSelect');
    
    // Clear existing options except the first one
    while (doctorSelect.options.length > 1) {
        doctorSelect.remove(1);
    }
    
    // Add doctors to the select dropdown
    doctors.forEach(doctor => {
        if (doctor.available) {
            const option = document.createElement('option');
            option.value = doctor.id;
            option.textContent = `${doctor.name} - ${doctor.specialty}`;
            option.setAttribute('data-doctor', JSON.stringify(doctor));
            doctorSelect.appendChild(option);
        }
    });
}


// Initialize FullCalendar with custom configuration
function initializeCalendar() {
    const calendarEl = document.getElementById('doctorCalendar');
    if (!calendarEl) return;
    
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'timeGridWeek',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'timeGridWeek,timeGridDay'
        },
        slotMinTime: '08:00:00',
        slotMaxTime: '18:00:00',
        slotDuration: '00:30:00',
        slotLabelInterval: '01:00:00',
        slotLabelFormat: {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        },
        allDaySlot: false,
        weekends: false,
        selectable: true,
        selectOverlap: false,
        selectMirror: true,
        dayHeaderFormat: { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric',
            omitCommas: true 
        },
        eventTimeFormat: {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        },
        selectAllow: function(selectInfo) {
//             // Only allow selection of available slots
            const events = calendar.getEvents();
            return events.some(event => {
                return selectInfo.start >= event.start && 
                       selectInfo.end <= event.end &&
                       event.extendedProps?.available === true;
            });
        },
        select: handleDateSelect,
        eventClick: handleEventClick,
        events: [],
        height: 'auto',
        nowIndicator: true,
        navLinks: true,
        businessHours: {
            daysOfWeek: [1, 2, 3, 4, 5], // Monday - Friday
            startTime: '09:00',
            endTime: '17:00'
        },
        validRange: {
            start: new Date(),
            end: new Date(new Date().getTime() + 14 * 24 * 60 * 60 * 1000) // 2 weeks
        },
        dayHeaderClassNames: 'fc-day-header-custom',
        slotLabelClassNames: 'fc-timegrid-slot-label-custom',
        dayCellClassNames: 'fc-day-custom',
        eventClassNames: 'fc-event-custom'
    });
    
    calendar.render();
}


// Handle date selection in calendar
function handleDateSelect(selectInfo) {
//     // Check if the selected slot is within available slots
    const events = calendar.getEvents();
    const isAvailable = events.some(event => {
        return selectInfo.start >= event.start && 
               selectInfo.end <= event.end &&
               event.extendedProps?.available;
    });
    
    if (!isAvailable) {
        alert('Please select an available time slot.');
        calendar.unselect();
        return;
    }
    
//     // Clear previous selection
    if (window.selectedEvent) {
        window.selectedEvent.remove();
    }
    
//     // Create a new event for the selected slot
    window.selectedEvent = calendar.addEvent({
        title: 'Selected',
        start: selectInfo.start,
        end: selectInfo.end,
        backgroundColor: '#1a73e8',
        borderColor: '#1a73e8',
        display: 'background',
        classNames: ['selected-slot']
    });
    
    selectedSlot = selectInfo;
    document.getElementById('nextToStep3').disabled = false;
    
//     // Update confirmation details
     const start = new Date(selectInfo.start);
    const end = new Date(selectInfo.end);
    
    document.getElementById('confirmDoctorName').textContent = selectedDoctor.name;
    document.getElementById('confirmDate').textContent = start.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    document.getElementById('confirmTime').textContent = `${start.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
    })} - ${end.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
    })}`;
    
     // Close any open popovers
    calendar.unselect();
}


// Handle event click in calendar
 function handleEventClick(clickInfo) {
     // Handle event click if needed
 }


// Step management
const steps = {
    current: 1,
    total: 3,
    
    // Validate if we can proceed to the next step
    validateStep: function(step) {
        const validations = {
            1: () => {
                if (!selectedDoctor) {
                    alert('Please select a doctor before proceeding.');
                    return false;
                }
                return true;
            },
            2: () => {
                if (!selectedSlot) {
                    alert('Please select an available time slot before proceeding.');
                    return false;
                }
                return true;
            }
        };
        return validations[step] ? validations[step]() : true;
    },
    
    // Update the UI to show the current step
    updateUI: function() {
        // Hide all steps
        document.querySelectorAll('.form-step').forEach(step => {
            step.classList.remove('active');
        });
        
        // Show current step
        const currentStepEl = document.querySelector(`#step${this.current}`);
        if (currentStepEl) currentStepEl.classList.add('active');
        
        // Update progress steps
        document.querySelectorAll('.step').forEach((stepEl, index) => {
            stepEl.classList.toggle('active', (index + 1) <= this.current);
        });
    },
    
    // Move to the next step
    next: function() {
        if (this.current >= this.total) return;
        
        if (this.validateStep(this.current)) {
            this.current++;
            this.updateUI();
            
            // Additional step-specific logic
            if (this.current === 2 && selectedDoctor) {
                loadDoctorAvailability(selectedDoctor.id);
            }
        }
    },
    
    // Move to the previous step
    prev: function() {
        if (this.current <= 1) return;
        
        this.current--;
        this.updateUI();
    },
    
    // Go to a specific step
    goTo: function(step) {
        if (step < 1 || step > this.total) return;
        
        // If going forward, validate current step first
        if (step > this.current) {
            if (!this.validateStep(this.current)) return;
        }
        
        this.current = step;
        this.updateUI();
        
        // Additional step-specific logic
        if (this.current === 2 && selectedDoctor) {
            loadDoctorAvailability(selectedDoctor.id);
        }
    }
};

// Navigation between steps
function nextStep() {
    steps.next();
}

function prevStep() {
    steps.prev();
}


// Generate available time slots for the next 14 days
function generateAvailableSlots(doctorId) {
    const slots = [];
    const now = new Date();
    const workStartHour = 9;  // 9 AM
    const workEndHour = 17;   // 5 PM
    const slotDuration = 30;  // minutes
    const daysToGenerate = 14; // Show availability for 2 weeks
    
    // Generate slots for the next X days
    for (let day = 0; day < daysToGenerate; day++) {
        const currentDate = new Date();
        currentDate.setDate(now.getDate() + day);
        currentDate.setHours(0, 0, 0, 0);
        
        // Skip weekends (0 = Sunday, 6 = Saturday)
        if (currentDate.getDay() === 0 || currentDate.getDay() === 6) continue;
        
        // Generate time slots for working hours
        for (let hour = workStartHour; hour < workEndHour; hour++) {
            for (let minute = 0; minute < 60; minute += slotDuration) {
                const start = new Date(currentDate);
                start.setHours(hour, minute, 0, 0);
                
                const end = new Date(start);
                end.setMinutes(minute + slotDuration);
                
                // Only add slots that are at least 1 hour in the future
                const nowPlusBuffer = new Date(now.getTime() + 60 * 60000);
                if (start > nowPlusBuffer) {
                    // Add some randomness to simulate real-world availability
                    // In a real app, this would come from your backend
                    if (Math.random() > 0.3) { // 70% chance a slot is available
                        slots.push({
                            id: `slot-${start.getTime()}`,
                            title: 'Available',
                            start: start,
                            end: end,
                            color: '#4CAF50',
                            display: 'block',
                            classNames: ['available-slot'],
                            extendedProps: {
                                available: true
                            }
                        });
                    }
                }
            }
        }
    }
    return slots;
}

// Load doctor's availability
function loadDoctorAvailability(doctorId) {
    if (!calendar) return;
    
    // Clear existing events
    calendar.removeAllEvents();
    
    // Generate and add available slots
    const availableSlots = generateAvailableSlots(doctorId);
    availableSlots.forEach(slot => {
        calendar.addEvent(slot);
    });
    
    // Show message if no slots available
    if (availableSlots.length === 0) {
        alert('No available time slots found for the selected doctor.');
    }
    
    // Ensure calendar is visible
    document.getElementById('doctorCalendarContainer').style.display = 'block';
}

// Show doctor calendar with available slots
function showDoctorCalendar(events) {
    if (!calendar) return;
    
    calendar.removeAllEvents();
    events.forEach(event => {
        calendar.addEvent(event);
    });
    
    document.getElementById('doctorCalendarContainer').style.display = 'block';
}

// Close confirmation popup
function closeConfirmationPopup() {
const popup = document.getElementById('appointmentConfirmationPopup');
popup.style.opacity = '0';
popup.style.transform = 'translateY(-20px)';
setTimeout(() => {
    popup.style.display = 'none';
}, 300);
}


// Confirm appointment
function confirmAppointment() {
if (!selectedDoctor || !selectedSlot) {
    alert('Please complete all steps before confirming.');
    return;
}
}
// Prepare appointment data
const appointmentData = {
    doctorId: selectedDoctor.id,
    doctorName: selectedDoctor.name,
    startTime: selectedSlot.start,
    endTime: selectedSlot.end,
    status: 'pending'
};

// Add to appointments table in View Appointments
const tbody = document.getElementById('appointmentsBody');
const tr = document.createElement('tr');
tr.innerHTML = `
    <td>${appointmentData.doctorName}</td>
    <td>${appointmentData.startTime.toLocaleDateString('en-GB')}</td>
    <td>${appointmentData.startTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - ${appointmentData.endTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
    <td>${appointmentData.status}</td>
    <td><button class="btn-cancel" onclick="this.closest('tr').remove()">Cancel</button></td>
`;
tbody.prepend(tr);

// Switch to View Appointments section
document.querySelectorAll('.dashboard-content').forEach(el => el.style.display = 'none');
document.getElementById('view-appointments-section').style.display = 'block';

// Reset the form for next booking
resetForm();



// Reset the form
function resetForm() {
// Reset to step 1
document.querySelectorAll('.form-step').forEach(step => step.classList.remove('active'));
document.getElementById('step1').classList.add('active');

// Reset progress steps
document.querySelectorAll('.step').forEach((step, index) => {
    step.classList.toggle('active', index === 0);
});

// Reset selections
selectedDoctor = null;
selectedSlot = null;
document.getElementById('doctorSearch').value = '';
document.getElementById('nextToStep2').disabled = true;
document.getElementById('nextToStep3').disabled = true;
document.querySelectorAll('.doctor-card').forEach(card => card.classList.remove('selected'));

// Clear calendar
if (calendar) {
    calendar.removeAllEvents();
}

// Reload doctors
loadDoctors();
}


// // Close view modal
// function closeViewModal() {
// const modal = document.getElementById('viewProfileModal');
// modal.style.opacity = '0';
// modal.style.transform = 'translateY(-20px)';
// setTimeout(() => {
//     modal.style.display = 'none';
// }, 300);
// }



// // Initialize navigation between sections
// // function initNavigation() {
// //     const navLinks = document.querySelectorAll('.nav-links a[data-section]');
// //     if (navLinks.length === 0) {
// //         console.log('No navigation links found with data-section attribute');
// //         return;
// //     }
    
// //     const sections = document.querySelectorAll('[id$="-section"]');
// //     if (sections.length === 0) {
// //         console.log('No sections found with -section suffix');
// //         return;
// //     }
    
// //     navLinks.forEach(link => {
// //         link.addEventListener('click', function(e) {
// //             e.preventDefault();
            
// //             const targetSection = this.getAttribute('data-section');
// //             console.log(`Navigating to section: ${targetSection}`);
            
// //             // Hide all sections
// //             sections.forEach(section => {
// //                 section.style.display = 'none';
// //             });
            
// //             // Show target section
// //             const targetElement = document.getElementById(targetSection + '-section');
// //             if (targetElement) {
// //                 targetElement.style.display = 'block';
                
// //                 // Load appointments when viewing that section
// //                 if (targetSection === 'view-appointments') {
// //                     loadAppointments();
// //                 }
// //             } else {
// //                 console.error(`Target section not found: ${targetSection}-section`);
// //             }
            
// //             // Update active link
// //             navLinks.forEach(navLink => {
// //                 navLink.parentElement.classList.remove('active');
// //             });
// //             this.parentElement.classList.add('active');
// //         });
// //     });
// // }

// // Load and display profile data
// function loadProfileData() {
//     showLoader('profileLoader');
    
//     fetch('/patient/profile', {
//         method: 'GET',
//         headers: {
//             'Authorization': 'Bearer ' + localStorage.getItem('access_token')
//         }
//     })
//     .then(response => {
//         if (response.status === 401) {
//             // Unauthorized - token expired or invalid
//             throw new Error('Unauthorized');
//         }
//         if (!response.ok) {
//             throw new Error('Failed to fetch profile');
//         }
//         return response.json();
//     })
//     .then(data => {
//         console.log("Profile data received:", data);
//         hideLoader('profileLoader');
        
//         if (data.status === 'success') {
//             // Update profile display in header
//             const nameElements = document.querySelectorAll('#labDisplayName, #patientDisplayName');
//             nameElements.forEach(el => {
//                 if (el) el.textContent = data.data.fullname;
//             });
            
//             // Update profile modal if it exists
//             const viewFullNameElement = document.getElementById('viewFullName');
//             if (viewFullNameElement) viewFullNameElement.textContent = data.data.fullname;
            
//             const viewEmailElement = document.getElementById('viewEmail');
//             if (viewEmailElement) viewEmailElement.textContent = data.data.email;
            
//             const viewPhoneElement = document.getElementById('viewPhone');
//             if (viewPhoneElement) viewPhoneElement.textContent = data.data.phone_number;
            
//             // Update additional profile fields if they exist
//             const viewGenderElement = document.getElementById('viewGender');
//             if (viewGenderElement && data.data.gender) {
//                 viewGenderElement.textContent = data.data.gender.charAt(0).toUpperCase() + data.data.gender.slice(1);
//             }
            
//             const viewBirthDateElement = document.getElementById('viewBirthDate');
//             if (viewBirthDateElement && data.data.birth_date) {
//                 const birthDate = new Date(data.data.birth_date);
//                 viewBirthDateElement.textContent = birthDate.toLocaleDateString('en-US', {
//                     year: 'numeric', month: 'long', day: 'numeric'
//                 });
//             }
//         }
//     })
//     .catch(error => {
//         hideLoader('profileLoader');
//         console.error('Error loading profile:', error);
        
//         if (error.message === 'Unauthorized') {
//             showAlert('error', 'Your session has expired. Please log in again.');
//             logout();
//         } else {
//             showAlert('error', 'Failed to load profile. Please refresh the page.');
//         }
//     });
// }



// //     // Reset previous options and show loading state
// //     timeSelect.innerHTML = '<option value="">Loading available times...</option>';
// //     timeSelect.disabled = true;

// //     console.log('Fetching available slots for doctor:', selectedDoctor.id, 'on', selectedDate);

// //     // Get token from localStorage
// //     const token = localStorage.getItem('access_token');
// //     if (!token) {
// //         console.error('No access token found');
// //         timeSelect.innerHTML = '<option value="">-- Select a Time --</option>';
// //         const errorOption = document.createElement('option');
// //         errorOption.textContent = 'Please log in again';
// //         errorOption.disabled = true;
// //         timeSelect.appendChild(errorOption);
// //         return;
// //     }

// //     // Use a direct API call to get time slots instead of the complex route
// //     // This is a simplified approach to fix the immediate issue
// //     fetch('/patient/apt/timeslots', {
// //         method: 'POST',
// //         headers: {
// //             'Content-Type': 'application/json',
// //             'Authorization': 'Bearer ' + token
// //         },
// //         body: JSON.stringify({
// //             doctor_id: selectedDoctor.id,
// //             date: selectedDate
// //         })
// //     })
// //     .then(response => {
// //         if (response.status === 401) {
// //             throw new Error('Unauthorized');
// //         }
// //         if (!response.ok) {
// //             throw new Error(`HTTP error! Status: ${response.status}`);
// //         }
// //         return response.json();
// //     })
// //     .then(data => {
// //         console.log('Time slots received:', data);

// //         // Reset time select
// //         timeSelect.innerHTML = '<option value="">-- Select a Time --</option>';
// //         timeSelect.disabled = false;

// //         if (data.status === 'success' && data.slots && data.slots.length > 0) {
// //             // Add time slots
// //             data.slots.forEach(slot => {
// //                 const option = document.createElement('option');
// //                 option.value = slot;
                
// //                 // Format slot time to AM/PM
// //                 const [hour, minute] = slot.split(':');
// //                 const h = parseInt(hour);
// //                 const ampm = h >= 12 ? 'PM' : 'AM';
// //                 const displayHour = h % 12 || 12;
// //                 option.textContent = `${displayHour}:${minute} ${ampm}`;
                
// //                 timeSelect.appendChild(option);
// //             });
// //         } else {
// //             // If no slots returned or API doesn't work, generate some default slots
// //             // This is a fallback to ensure something is displayed
// //             generateDefaultTimeSlots(timeSelect, selectedDate);
// //         }
// //     })
// //     .catch(error => {
// //         console.error('Error loading time slots:', error);
        
// //         // Generate default time slots as a fallback
// //         generateDefaultTimeSlots(timeSelect, selectedDate);
        
// //         if (error.message === 'Unauthorized') {
// //             showAlert('error', 'Your session has expired. Please log in again.');
// //             logout();
// //         }
// //     });

// //     // Remove any existing event listeners to prevent duplicates
// //     const newTimeSelect = timeSelect.cloneNode(true);
// //     timeSelect.parentNode.replaceChild(newTimeSelect, timeSelect);
    
// //     // Add event listener to the new select element
// //     newTimeSelect.addEventListener('change', function() {
// //         if (this.value) {
// //             selectedSlot = {
// //                 date: selectedDate,
// //                 time: this.value,
// //                 display: this.options[this.selectedIndex].textContent
// //             };

// //             // Enable next button
// //             const nextBtn = document.getElementById('nextToStep3');
// //             if (nextBtn) nextBtn.disabled = false;
// //         } else {
// //             selectedSlot = null;
            
// //             // Disable next button
// //             const nextBtn = document.getElementById('nextToStep3');
// //             if (nextBtn) nextBtn.disabled = true;
// //         }
// //     });


// // // Generate default time slots as a fallback
// // function generateDefaultTimeSlots(timeSelect, selectedDate) {
// //     // Clear existing options
// //     timeSelect.innerHTML = '<option value="">-- Select a Time --</option>';
// //     timeSelect.disabled = false;
    
// //     // Generate time slots from 9 AM to 5 PM in 30-minute intervals
// //     const startHour = 9;
// //     const endHour = 17;
    
// //     for (let hour = startHour; hour < endHour; hour++) {
// //         for (let minute = 0; minute < 60; minute += 30) {
// //             const timeValue = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
// //             const option = document.createElement('option');
// //             option.value = timeValue;
            
// //             // Format for display (12-hour with AM/PM)
// //             const h = hour % 12 || 12;
// //             const ampm = hour >= 12 ? 'PM' : 'AM';
// //             option.textContent = `${h}:${minute.toString().padStart(2, '0')} ${ampm}`;
            
// //             timeSelect.appendChild(option);
// //         }
// //     }
    
// //     // Show a warning that these are fallback slots
// //     showAlert('warning', 'Using default time slots. Actual availability may differ.');
// // }

// // // Book appointment
// // function bookAppointment() {
// //     console.log('Booking appointment...');
    
// //     if (!selectedDoctor || !selectedSlot) {
// //         showAlert('error', 'Please select a doctor and time slot');
// //         return;
// //     }
    
// //     // Disable confirm button to prevent double booking
// //     const confirmBtn = document.getElementById('confirmBooking');
// //     if (confirmBtn) {
// //         confirmBtn.disabled = true;
// //         confirmBtn.textContent = 'Booking...';
// //     }
    
// //     // Format the appointment data according to what the backend expects
// //     const appointmentData = {
// //         doctor_id: selectedDoctor.id,
// //         doctor_name: selectedDoctor.name,
// //         medical_specialty: selectedDoctor.specialty,
// //         date: selectedSlot.date,
// //         time: selectedSlot.time
// //     };
    
// //     console.log('Booking appointment with data:', appointmentData);
    
// //     fetch('/patient/apt/book', {
// //         method: 'POST',
// //         headers: {
// //             'Content-Type': 'application/json',
// //             'Authorization': 'Bearer ' + localStorage.getItem('access_token')
// //         },
// //         body: JSON.stringify(appointmentData)
// //     })
// //     .then(response => {
// //         if (response.status === 401) {
// //             throw new Error('Unauthorized');
// //         }
// //         return response.json();
// //     })
// //     .then(data => {
// //         console.log('Booking response:', data);
        
// //         // Re-enable confirm button
// //         if (confirmBtn) {
// //             confirmBtn.disabled = false;
// //             confirmBtn.textContent = 'Confirm Booking';
// //         }
        
// //         if (data.status === 'success') {
// //             showAlert('success', data.message || 'Appointment booked successfully');
            
// //             // Reset form and selected values
// //             selectedDoctor = null;
// //             selectedSlot = null;
            
// //             // Reset the booking form UI
// //             resetBookingForm();
            
// //             // Switch to view appointments section
// //             const viewApptsLink = document.querySelector('a[data-section="view-appointments"]');
// //             if (viewApptsLink) {
// //                 viewApptsLink.click();
// //             }
// //         } else {
// //             showAlert('error', data.message || 'Error booking appointment');
// //         }
// //     })
// //     .catch(error => {
// //         console.error('Error booking appointment:', error);
        
// //         // Re-enable confirm button
// //         if (confirmBtn) {
// //             confirmBtn.disabled = false;
// //             confirmBtn.textContent = 'Confirm Booking';
// //         }
        
// //         if (error.message === 'Unauthorized') {
// //             showAlert('error', 'Your session has expired. Please log in again.');
// //             logout();
// //         } else {
// //             showAlert('error', 'Failed to book appointment. Please try again.');
// //         }
// //     });
// // }

// // // Function to reset the booking form
// // function resetBookingForm() {
// //     // Reset doctor selection
// //     const doctorSelect = document.getElementById('doctorSelect');
// //     if (doctorSelect) {
// //         doctorSelect.selectedIndex = 0;
// //     }
    
// //     // Clear selected time slot
// //     const timeSlots = document.querySelectorAll('.time-slot');
// //     timeSlots.forEach(slot => {
// //         slot.classList.remove('selected');
// //     });
    
// //     // Reset to step 1
// //     const steps = document.querySelectorAll('.booking-step');
// //     steps.forEach(step => {
// //         step.classList.remove('active');
// //     });
    
// //     const step1 = document.getElementById('step1');
// //     if (step1) {
// //         step1.classList.add('active');
// //     }
    
// //     // Reset progress indicator
// //     updateProgressIndicator(1);
    
// //     // Reset global variables
// //     selectedDoctor = null;
// //     selectedSlot = null;
// // }

// // // Load appointments
// // function loadAppointments() {
// //     console.log('Loading appointments');
// //     const appointmentsContainer = document.getElementById('appointments-container');
// //     if (!appointmentsContainer) {
// //         console.error('Appointments container not found');
// //         return;
// //     }
    
// //     // Show loading spinner
// //     appointmentsContainer.innerHTML = `
// //         <div class="text-center p-5">
// //             <div class="spinner-border text-primary" role="status">
// //                 <span class="visually-hidden">Loading...</span>
// //             </div>
// //             <p class="mt-2">Loading your appointments...</p>
// //         </div>
// //     `;
    
// //     fetch('/patient/apt/list', {
// //         method: 'GET',
// //         headers: {
// //             'Authorization': 'Bearer ' + localStorage.getItem('access_token')
// //         }
// //     })
// //     .then(response => {
// //         if (response.status === 401) {
// //             throw new Error('Unauthorized');
// //         }
// //         if (!response.ok) {
// //             throw new Error(`HTTP error! Status: ${response.status}`);
// //         }
// //         return response.json();
// //     })
// //     .then(data => {
// //         console.log('Appointments data:', data);
        
// //         if (data.status === 'success' && data.appointments && data.appointments.length > 0) {
// //             // Render appointments
// //             let html = `
// //                 <div class="table-responsive">
// //                     <table class="table table-hover">
// //                         <thead>
// //                             <tr>
// //                                 <th>Doctor</th>
// //                                 <th>Specialty</th>
// //                                 <th>Date</th>
// //                                 <th>Time</th>
// //                                 <th>Status</th>
// //                                 <th>Actions</th>
// //                             </tr>
// //                         </thead>
// //                         <tbody>
// //             `;
            
// //             data.appointments.forEach(apt => {
// //                 // Format date
// //                 const date = new Date(apt.date);
// //                 const formattedDate = date.toLocaleDateString('en-US', {
// //                     year: 'numeric', month: 'long', day: 'numeric'
// //                 });
                
// //                 // Format time
// //                 const timeParts = apt.time.split(':');
// //                 const hour = parseInt(timeParts[0]);
// //                 const minute = timeParts[1];
// //                 const ampm = hour >= 12 ? 'PM' : 'AM';
// //                 const hour12 = hour % 12 || 12;
// //                 const formattedTime = `${hour12}:${minute} ${ampm}`;
                
// //                 // Status badge class
// //                 let statusClass = '';
// //                 switch (apt.status.toLowerCase()) {
// //                     case 'pending':
// //                         statusClass = 'bg-warning text-dark';
// //                         break;
// //                     case 'confirmed':
// //                         statusClass = 'bg-success';
// //                         break;
// //                     case 'completed':
// //                         statusClass = 'bg-info';
// //                         break;
// //                     case 'cancelled':
// //                         statusClass = 'bg-danger';
// //                         break;
// //                     default:
// //                         statusClass = 'bg-secondary';
// //                 }
                
// //                 // Cancel button (only show for pending or confirmed appointments)
// //                 const cancelButton = (apt.status.toLowerCase() === 'pending' || apt.status.toLowerCase() === 'confirmed') 
// //                     ? `<button class="btn btn-sm btn-outline-danger cancel-apt" data-apt-id="${apt.id}">Cancel</button>` 
// //                     : '';
                
// //                 html += `
// //                     <tr>
// //                         <td>${apt.doctor_name}</td>
// //                         <td>${apt.doctor_specialty}</td>
// //                         <td>${formattedDate}</td>
// //                         <td>${formattedTime}</td>
// //                         <td><span class="badge ${statusClass}">${apt.status}</span></td>
// //                         <td>${cancelButton}</td>
// //                     </tr>
// //                 `;
// //             });
            
// //             html += `
// //                         </tbody>
// //                     </table>
// //                 </div>
// //             `;
            
// //             appointmentsContainer.innerHTML = html;
            
// //             // Add event listeners to cancel buttons
// //             const cancelButtons = document.querySelectorAll('.cancel-apt');
// //             cancelButtons.forEach(btn => {
// //                 btn.addEventListener('click', function() {
// //                     const aptId = this.getAttribute('data-apt-id');
// //                     cancelAppointment(aptId);
// //                 });
// //             });
// //         } else {
// //             // No appointments
// //             appointmentsContainer.innerHTML = `
// //                 <div class="text-center p-5">
// //                     <div class="alert alert-info">
// //                         <i class="fas fa-info-circle me-2"></i>
// //                         You don't have any appointments yet.
// //                     </div>
// //                     <button class="btn btn-primary mt-3" id="bookNewAppointmentBtn">
// //                         <i class="fas fa-calendar-plus me-2"></i>
// //                         Book an Appointment
// //                     </button>
// //                 </div>
// //             `;
            
// //             // Add event listener to book button
// //             const bookBtn = document.getElementById('bookNewAppointmentBtn');
// //             if (bookBtn) {
// //                 bookBtn.addEventListener('click', function() {
// //                     // Navigate to book appointment section
// //                     const bookLink = document.querySelector('a[data-section="book-appointment"]');
// //                     if (bookLink) {
// //                         bookLink.click();
// //                     }
// //                 });
// //             }
// //         }
// //     })
// //     .catch(error => {
// //         console.error('Error loading appointments:', error);
        
// //         appointmentsContainer.innerHTML = `
// //             <div class="alert alert-danger">
// //                 <i class="fas fa-exclamation-triangle me-2"></i>
// //                 Failed to load appointments. ${error.message}
// //             </div>
// //             <button class="btn btn-primary mt-3" id="retryLoadAppointmentsBtn">
// //                 <i class="fas fa-sync me-2"></i>
// //                 Retry
// //             </button>
// //         `;
        
// //         // Add event listener to retry button
// //         const retryBtn = document.getElementById('retryLoadAppointmentsBtn');
// //         if (retryBtn) {
// //             retryBtn.addEventListener('click', loadAppointments);
// //         }
        
// //         if (error.message === 'Unauthorized') {
// //             showAlert('error', 'Your session has expired. Please log in again.');
// //             logout();
// //         }
// //     });
// // }

// // // Cancel appointment
// // function cancelAppointment(appointmentId) {
// //     if (!confirm('Are you sure you want to cancel this appointment?')) {
// //         return;
// //     }
    
// //     fetch(`/patient/apt/cancel/${appointmentId}`, {
// //         method: 'POST',
// //         headers: {
// //             'Authorization': 'Bearer ' + localStorage.getItem('access_token')
// //         }
// //     })
// //     .then(response => {
// //         if (response.status === 401) {
// //             throw new Error('Unauthorized');
// //         }
// //         if (!response.ok) {
// //             throw new Error(`HTTP error! Status: ${response.status}`);
// //         }
// //         return response.json();
// //     })
// //     .then(data => {
// //         console.log('Cancel response:', data);
        
// //         if (data.status === 'success') {
// //             showAlert('success', 'Appointment cancelled successfully');
// //             // Reload appointments
// //             loadAppointments();
// //         } else {
// //             showAlert('error', data.message || 'Failed to cancel appointment');
// //         }
// //     })
// //     .catch(error => {
// //         console.error('Error cancelling appointment:', error);
        
// //         if (error.message === 'Unauthorized') {
// //             showAlert('error', 'Your session has expired. Please log in again.');
// //             logout();
// //         } else {
// //             showAlert('error', 'Failed to cancel appointment. Please try again.');
// //         }
// //     });
// // }

// // // Close view modal
// // function closeViewModal() {
// // const modal = document.getElementById('viewProfileModal');
// // modal.style.opacity = '0';
// // modal.style.transform = 'translateY(-20px)';
// // setTimeout(() => {
// //     modal.style.display = 'none';
// // }, 300);
// // }

// // // Book appointment - Step 3 confirmation button
// // document.getElementById('confirmBooking').addEventListener('click', function() {
// //     // Get selected doctor and time slot from the form
// //     const appointmentData = {
// //         doctor_name: selectedDoctor.name,
// //         medical_specialty: selectedDoctor.specialty,
// //         date: selectedSlot.start.toISOString().split('T')[0],
// //         time: selectedSlot.start.toTimeString().substring(0, 5)
// //     };

// //     // Call the API to book the appointment
// //     fetch('/patient/apt/book', {
// //         method: 'POST',
// //         headers: {
// //             'Content-Type': 'application/json',
// //             'Authorization': 'Bearer ' + localStorage.getItem('access_token')
// //         },
// //         body: JSON.stringify(appointmentData)
// //     })
// //     .then(response => response.json())
// //     .then(data => {
// //         if (data.status === 'success') {
// //             alert(data.message);
// //             resetForm();
// //             // Switch to View Appointments section
// //             document.querySelector('a[data-section="view-appointments"]').click();
// //             loadAppointments(); // Refresh appointments list
// //         } else {
// //             alert('Error: ' + data.message);
// //         }
// //     })
// //     .catch(error => {
// //         console.error('Error booking appointment:', error);
// //         alert('Failed to book appointment. Please try again.');
// //     });
// // });

// // Function to load appointments
// // f