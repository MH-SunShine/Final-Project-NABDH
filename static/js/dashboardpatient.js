
// Global variables
let selectedDoctor = null;
let selectedSlot = null;
let calendar = null;

// Sample doctor data - in a real app, this would come from the backend
const doctors = [
    { 
        id: 1, 
        name: 'Dr. amira', 
        specialty: 'Cardiologist', 
        available: true,
        email: "a@example.com",
        phone: "+213"
    },
    { 
        id: 2, 
        name: 'Dr. fatima', 
        specialty: 'Neurologist', 
        available: true,
        email: "a@example.com",
        phone: "+213"
    },

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
}


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


// Close view modal
function closeViewModal() {
const modal = document.getElementById('viewProfileModal');
modal.style.opacity = '0';
modal.style.transform = 'translateY(-20px)';
setTimeout(() => {
    modal.style.display = 'none';
}, 300);
}


