

// Doctor availability data (this would typically come from your backend)
const doctorAvailability = {
    'dr1': ['2024-03-20', '2024-03-22', '2024-03-25'],
    'dr2': ['2024-03-21', '2024-03-23', '2024-03-26'],
    'dr3': ['2024-03-24', '2024-03-27', '2024-03-28']
};

// Form handling
document.getElementById('doctorSelect').addEventListener('change', function() {
    const selectedDoctor = this.value;
    const dateInput = document.getElementById('appointmentDate');
    
    // Clear previous dates
    dateInput.innerHTML = '';
    
    if (selectedDoctor && doctorAvailability[selectedDoctor]) {
        // Enable date input
        dateInput.disabled = false;
        
        // Set available dates
        const availableDates = doctorAvailability[selectedDoctor];
        dateInput.min = availableDates[0];
        dateInput.max = availableDates[availableDates.length - 1];
        
        // Add event listener to validate selected date
        dateInput.addEventListener('input', function() {
            const selectedDate = this.value;
            if (!availableDates.includes(selectedDate)) {
                alert('Please select an available date for this doctor');
                this.value = '';
            }
        });
    } else {
        // Disable date input if no doctor selected
        dateInput.disabled = true;
        dateInput.value = '';
    }
});

document.getElementById('bookAppointmentForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Collect form data
    const formData = {
        doctor: document.getElementById('doctorSelect').value,
        date: document.getElementById('appointmentDate').value,
        time: document.getElementById('appointmentTime').value,
    };

    // Show confirmation popup instead of directly submitting
    showConfirmationPopup(formData);
});

function clearForm() {
    document.getElementById('bookAppointmentForm').reset();
    document.getElementById('appointmentDate').disabled = true;
}

// Initialize form
document.getElementById('appointmentDate').disabled = true;

// Confirmation Popup
function showConfirmationPopup(formData) {
    // Fill confirmation popup with appointment details
    document.getElementById('confirmDoctor').textContent = document.getElementById('doctorSelect').options[document.getElementById('doctorSelect').selectedIndex].text;
    document.getElementById('confirmDate').textContent = formData.date;
    document.getElementById('confirmTime').textContent = formData.time;

    // Show popup
    document.getElementById('appointmentConfirmationPopup').style.display = 'block';
}

function closeConfirmationPopup() {
    document.getElementById('appointmentConfirmationPopup').style.display = 'none';
}

// Function to save appointment to localStorage
function saveAppointment(appointment) {
    let appointments = JSON.parse(localStorage.getItem('appointments')) || [];
    appointments.push({
        ...appointment,
        id: Date.now(),
        status: 'Pending'
    });
    localStorage.setItem('appointments', JSON.stringify(appointments));
    displayAppointments();
}

// Function to display appointments in the table
function displayAppointments() {
    const appointments = JSON.parse(localStorage.getItem('appointments')) || [];
    const tbody = document.getElementById('appointmentsBody');
    tbody.innerHTML = '';

    if (appointments.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 20px;">
                    <i class="fas fa-calendar-times" style="font-size: 24px; color: #ccc; margin-bottom: 10px;"></i>
                    <p>No appointments booked yet</p>
                </td>
            </tr>
        `;
        return;
    }

    appointments.forEach(appointment => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${appointment.doctor}</td>
            <td>${appointment.date}</td>
            <td>${appointment.time}</td>
            <td><span class="status-badge ${appointment.status.toLowerCase()}">${appointment.status}</span></td>
            <td>
                <button class="action-btn reschedule-btn" onclick="rescheduleAppointment(${appointment.id})">
                    <i class="fas fa-calendar-alt"></i> Reschedule
                </button>
                <button class="action-btn cancel-btn" onclick="cancelAppointment(${appointment.id})">
                    <i class="fas fa-times"></i> Cancel
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Function to cancel an appointment
function cancelAppointment(id) {
    let appointments = JSON.parse(localStorage.getItem('appointments')) || [];
    appointments = appointments.map(app => {
        if (app.id === id) {
            return { ...app, status: 'Cancelled' };
        }
        return app;
    });
    localStorage.setItem('appointments', JSON.stringify(appointments));
    displayAppointments();
}

// Function to reschedule an appointment
function rescheduleAppointment(id) {
    // Switch to Book Appointments section
    document.querySelector('a[data-section="book-appointments"]').click();
    // You can add additional logic here to pre-fill the form with the appointment details
}

// Update the confirmAppointment function
function confirmAppointment() {
    const formData = {
        doctor: document.getElementById('doctorSelect').options[document.getElementById('doctorSelect').selectedIndex].text,
        date: document.getElementById('appointmentDate').value,
        time: document.getElementById('appointmentTime').value
    };

    // Save the appointment
    saveAppointment(formData);
    
    // Show success message
    alert('Appointment booked successfully!');
    
    // Close popup and clear form
    closeConfirmationPopup();
    clearForm();

    // Switch to View Appointments section
    document.querySelector('a[data-section="view-appointments"]').click();
}

// Load appointments when page loads
document.addEventListener('DOMContentLoaded', function() {
    displayAppointments();
});
