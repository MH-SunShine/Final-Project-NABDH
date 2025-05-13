// Toast Notification System
const showToast = (message, type = 'success') => {
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            color: white;
            padding: 15px 25px;
            border-radius: 5px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            z-index: 9999;
            display: none;
            font-family: 'Poppins', sans-serif;
        `;
        document.body.appendChild(toast);
    }

    toast.style.background = type === 'success' ? '#4CAF50' : '#dc3545';
    toast.textContent = message;
    toast.style.display = 'block';
    
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
};

// Profile Management
const profileManager = {
    openUpdateModal: (event) => {
        event.preventDefault();
        const modal = document.getElementById('updateProfileModal');
        modal.style.display = 'block';
        modal.offsetHeight;
        modal.style.opacity = '1';
        modal.querySelector('div').style.transform = 'translateY(0)';
        document.querySelector('.profile-dropdown').classList.remove('active');
    },

    closeUpdateModal: () => {
        const modal = document.getElementById('updateProfileModal');
        modal.style.opacity = '0';
        modal.querySelector('div').style.transform = 'translateY(-20px)';
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    },

    handleProfileImageChange: (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                document.getElementById('modalProfileImage').src = e.target.result;
                document.querySelector('.user-profile img').src = e.target.result;
                localStorage.setItem('doctorProfileImage', e.target.result);
                showToast('Profile image updated successfully!');
            };
            reader.onerror = () => {
                showToast('Error updating profile image. Please try again.', 'error');
            };
            reader.readAsDataURL(file);
        }
    },

    saveProfile: () => {
        const formData = {
            doctorName: document.querySelector('input[name="doctorName"]')?.value || 'Doctor Name',
            email: document.querySelector('input[type="email"]')?.value || '',
            phone: document.querySelector('input[type="tel"]')?.value || '',
            address: document.querySelector('textarea')?.value || '',
            specialization: document.querySelector('input[name="specialization"]')?.value || ''
        };
        document.getElementById('labDisplayName').textContent = profileData.fullName;


        localStorage.setItem('doctorProfileData', JSON.stringify(formData));
        profileManager.closeUpdateModal();
        showToast('Profile updated successfully!');
    }
};
// Load profile data when page loads
document.addEventListener('DOMContentLoaded', function() {
    const profileData = JSON.parse(localStorage.getItem('doctorProfile') || '{}');
    const welcomeNameElement = document.getElementById('labDisplayName');
    
    if (profileData.fullName) {
        welcomeNameElement.textContent = profileData.fullName;
    } else {
        welcomeNameElement.textContent = 'Dr.'; // Default name if no profile data
    }
});


// Calendar event handling
document.addEventListener('DOMContentLoaded', function() {
    var calendarEl = document.getElementById('calendar');
    var calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'timeGridWeek',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        slotMinTime: '08:00:00',
        slotMaxTime: '20:00:00',
        slotDuration: '00:30:00',
        allDaySlot: false,
        slotLabelInterval: '00:30:00',
        slotLabelFormat: {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        },
        events: loadAvailabilityEvents(),
        selectable: true,
        select: function(info) {
            const action = prompt('What would you like to do?\n1. Manage this time slot\n2. Manage entire day');
            
            if (action === '1') {
                // Time slot management
                const existingEvents = calendar.getEvents();
                const isUnavailable = existingEvents.some(event => 
                    event.start.toISOString() === info.startStr && 
                    event.end.toISOString() === info.endStr &&
                    event.extendedProps.status === 'unavailable'
                );

                if (isUnavailable) {
                    if (confirm('This time slot is currently unavailable. Would you like to make it available?')) {
                        existingEvents.forEach(event => {
                            if (event.start.toISOString() === info.startStr && 
                                event.end.toISOString() === info.endStr) {
                                event.remove();
                            }
                        });
                        removeAvailability(info.startStr, info.endStr);
                    }
                } else {
                    if (confirm('Would you like to mark this time slot as unavailable?')) {
                        calendar.addEvent({
                            title: 'Unavailable',
                            start: info.startStr,
                            end: info.endStr,
                            backgroundColor: '#dc3545',
                            extendedProps: { status: 'unavailable' }
                        });
                        saveAvailability(info.startStr, info.endStr, 'unavailable');
                    }
                }
            } else if (action === '2') {
                // Full day management
                const startOfDay = new Date(info.start);
                startOfDay.setHours(8, 0, 0);
                const endOfDay = new Date(info.start);
                endOfDay.setHours(20, 0, 0);
                
                // Check if day is already marked as unavailable
                const existingEvents = calendar.getEvents();
                const isDayUnavailable = existingEvents.some(event => 
                    event.start.toDateString() === startOfDay.toDateString() &&
                    event.extendedProps.status === 'unavailable'
                );

                if (isDayUnavailable) {
                    if (confirm('This day is currently unavailable. Would you like to make it available?')) {
                        // Remove all events for this day
                        existingEvents.forEach(event => {
                            if (event.start.toDateString() === startOfDay.toDateString()) {
                                event.remove();
                                removeAvailability(event.start.toISOString(), event.end.toISOString());
                            }
                        });
                    }
                } else {
                    if (confirm('Would you like to mark this entire day as unavailable?')) {
                        // Remove existing events for this day
                        existingEvents.forEach(event => {
                            if (event.start.toDateString() === startOfDay.toDateString()) {
                                event.remove();
                                removeAvailability(event.start.toISOString(), event.end.toISOString());
                            }
                        });
                        
                        calendar.addEvent({
                            title: 'Day Unavailable',
                            start: startOfDay,
                            end: endOfDay,
                            backgroundColor: '#dc3545',
                            extendedProps: { status: 'unavailable' }
                        });
                        saveAvailability(startOfDay.toISOString(), endOfDay.toISOString(), 'unavailable');
                    }
                }
            }
        },
        eventClick: function(info) {
            if (info.event.extendedProps.status === 'unavailable') {
                if (confirm('This time slot is currently unavailable. Would you like to make it available?')) {
                    info.event.remove();
                    removeAvailability(info.event.start.toISOString(), info.event.end.toISOString());
                }
            } else {
                if (confirm('Would you like to mark this time slot as unavailable?')) {
                    info.event.setProp('backgroundColor', '#dc3545');
                    info.event.setProp('title', 'Unavailable');
                    info.event.setExtendedProp('status', 'unavailable');
                    updateAvailability(info.event.start.toISOString(), info.event.end.toISOString(), 'unavailable');
                }
            }
        }
    });
    calendar.render();

    // Navigation handling
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('data-section');
            
            document.querySelectorAll('.dashboard-content').forEach(content => {
                content.style.display = 'none';
            });
            
            if (section === 'history') {
                document.getElementById('history-section').style.display = 'block';
                loadHistory();
            } else if (section === 'completed-consultation') {
                document.getElementById('completed-consultation-section').style.display = 'block';
                loadCompletedConsultations();
            } else if (section === 'pending-consultation') {
                document.getElementById('pending-consultation-section').style.display = 'block';
            } else if (section === 'myschedule') {
                document.getElementById('myschedule-section').style.display = 'block';
                calendar.render();
            } else if (section === 'dashboard') {
                document.getElementById('dashboard-section').style.display = 'block';
            }
        });
    });
});

function loadAvailabilityEvents() {
    let schedules = JSON.parse(localStorage.getItem('doctorSchedules') || '[]');
    return schedules.map(schedule => ({
        title: schedule.status === 'available' ? 'Available' : 'Unavailable',
        start: schedule.start,
        end: schedule.end,
        backgroundColor: schedule.status === 'available' ? '#4CAF50' : '#dc3545',
        extendedProps: { status: schedule.status }
    }));
}

function saveAvailability(start, end, status) {
    let schedules = JSON.parse(localStorage.getItem('doctorSchedules') || '[]');
    schedules.push({ start, end, status });
    localStorage.setItem('doctorSchedules', JSON.stringify(schedules));
}

function removeAvailability(start, end) {
    let schedules = JSON.parse(localStorage.getItem('doctorSchedules') || '[]');
    schedules = schedules.filter(schedule => 
        schedule.start !== start || schedule.end !== end
    );
    localStorage.setItem('doctorSchedules', JSON.stringify(schedules));
}

function updateAvailability(start, end, newStatus) {
    let schedules = JSON.parse(localStorage.getItem('doctorSchedules') || '[]');
    schedules = schedules.map(schedule => {
        if (schedule.start === start && schedule.end === end) {
            return { ...schedule, status: newStatus };
        }
        return schedule;
    });
    localStorage.setItem('doctorSchedules', JSON.stringify(schedules));
}

function confirmConsultation(button) {
    const row = button.closest('tr');
    const consultationData = {
        patient: row.cells[0].textContent,
        date: row.cells[1].textContent,
        time: row.cells[2].textContent
    };

    const completedBody = document.getElementById('completedConsultationsBody');
    const newRow = document.createElement('tr');
    newRow.innerHTML = `
        <td>${consultationData.patient}</td>
        <td>${consultationData.date}</td>
        <td>${consultationData.time}</td>
        <td><span class="status-badge completed">Completed</span></td>
        <td class="action-buttons">
            <button class="btn-record" onclick="openRecordModal(this)">Extra</button>
        </td>
    `;
    completedBody.appendChild(newRow);
    row.remove();
    saveConsultationStatus(consultationData, 'completed');
}

function saveConsultationStatus(consultation, status) {
    let consultations = JSON.parse(localStorage.getItem('doctorConsultations') || '[]');
    consultations.push({
        ...consultation,
        status: status,
        dateCompleted: new Date().toISOString()
    });
    localStorage.setItem('doctorConsultations', JSON.stringify(consultations));
}

function loadCompletedConsultations() {
    const consultations = JSON.parse(localStorage.getItem('doctorConsultations') || '[]');
    const completedBody = document.getElementById('completedConsultationsBody');
    completedBody.innerHTML = '';

    consultations
        .filter(consultation => consultation.status === 'completed')
        .forEach(consultation => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${consultation.patient}</td>
                <td>${consultation.date}</td>
                <td>${consultation.time}</td>
                <td><span class="status-badge completed">Completed</span></td>
                <td class="action-buttons">
                    <button class="btn-record" onclick="openRecordModal(this)">Extra</button>
                </td>
            `;
            completedBody.appendChild(row);
        });
}

function cancelConsultation(button) {
    const row = button.closest('tr');
    const consultationData = {
        patient: row.cells[0].textContent,
        date: row.cells[1].textContent,
        time: row.cells[2].textContent,
        status: 'pending'
    };

    addToHistory(consultationData);
    row.remove();
    saveConsultationStatus(consultationData, 'cancelled');
}

function addToHistory(consultation) {
    const historyBody = document.getElementById('historyConsultationsBody');
    const newRow = document.createElement('tr');
    newRow.innerHTML = `
        <td>${consultation.patient}</td>
        <td>${consultation.date}</td>
        <td>${consultation.time}</td>
        <td><span class="status-badge ${consultation.status}">${
            consultation.status === 'pending' ? 'Pending' : 
            consultation.status === 'completed' ? 'Completed' : 'Cancelled'
        }</span></td>
        <td class="action-buttons">
            <button class="btn-record" onclick="openRecordModal(this)">Extra</button>
        </td>
    `;
    historyBody.appendChild(newRow);
}

function loadHistory() {
    const consultations = JSON.parse(localStorage.getItem('doctorConsultations') || '[]');
    const historyBody = document.getElementById('historyConsultationsBody');
    historyBody.innerHTML = '';

    consultations.forEach(consultation => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${consultation.patient}</td>
            <td>${consultation.date}</td>
            <td>${consultation.time}</td>
            <td><span class="status-badge ${consultation.status}">${
                consultation.status === 'pending' ? 'Pending' : 
                consultation.status === 'completed' ? 'Completed' : 'Cancelled'
            }</span></td>
            <td class="action-buttons">
                <button class="btn-record" onclick="openRecordModal(this)">Extra</button>
            </td>
        `;
        historyBody.appendChild(row);
    });
}

function openRecordModal(button) {
    const modal = document.getElementById('recordModal');
    modal.style.display = 'block';
}

function closeRecordModal() {
    const modal = document.getElementById('recordModal');
    modal.style.display = 'none';
}

// Window click event for modal
window.onclick = function(event) {
    const modal = document.getElementById('recordModal');
    if (event.target == modal) {
        closeRecordModal();
    }
}

function sendTestRequest() {
    const testType = document.getElementById('testType').value;
    const urgency = document.getElementById('urgency').value;
    const notes = document.getElementById('notes').value;

    if (!testType) {
        alert('Please select a test type');
        return;
    }

    // Save test request
    const testRequest = {
        type: testType,
        urgency: urgency,
        notes: notes,
        date: new Date().toISOString()
    };

    // Save to localStorage
    let testRequests = JSON.parse(localStorage.getItem('testRequests') || '[]');
    testRequests.push(testRequest);
    localStorage.setItem('testRequests', JSON.stringify(testRequests));

    alert('Test request sent successfully');
    closeRecordModal();
}


    document.querySelectorAll('.tab-btn').forEach(button => {
    button.addEventListener('click', function() {
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.style.display = 'none';
        });

        // Show the selected tab
        const tabId = this.getAttribute('data-tab');
        document.getElementById(tabId + 'Tab').style.display = 'block';

        // Change active tab button
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        this.classList.add('active');
    });
});

function saveNote() {
    const noteText = document.getElementById('newNoteText').value;
    if (noteText.trim() !== '') {
        // Save the note (you could send this to a backend or save in local storage)
        alert("Note saved successfully!");
        document.getElementById('newNoteText').value = ''; // Clear the textarea
    } else {
        alert("Please type a note before saving.");
    }
}

function submitTestRequest() {
    const testType = document.getElementById('testType').value;
    if (testType.trim() !== '') {
        // Submit the test request (you could send this to a backend or save in local storage)
        alert("Test request submitted successfully!");
        document.getElementById('testType').value = ''; // Clear the select
    } else {
        alert("Please select a test type before submitting.");
    }
}   



// Example for opening and closing modals
function openMedicalFolderModal(button) {
    const modal = document.getElementById('medicalFolderModal');
    modal.style.display = 'block';  // Show modal
}

function openMedicalFolderModalview(button) {
    const modal = document.getElementById('medicalFolderModalview');
    modal.style.display = 'block';  // Show modal
}

function closeMedicalFolderModalview() {
    const modal = document.getElementById('medicalFolderModalview');
    modal.style.display = 'none';  // Hide modal
}


function closeMedicalFolderModal() {
    const modal = document.getElementById('medicalFolderModal');
    modal.style.display = 'none';  // Hide modal

}


// Toggle the view of notes and test sections
function toggleTab(tabName) {
    const notesTab = document.getElementById('notesTab');
    const testsTab = document.getElementById('testsTab');
    
    if (tabName === 'notes') {
        notesTab.style.display = 'block';
        testsTab.style.display = 'none';
    } else {
        notesTab.style.display = 'none';
        testsTab.style.display = 'block';
    }
}




// Attach event listener for tab buttons
document.querySelectorAll('.tab-btn').forEach(button => {
    button.addEventListener('click', switchTab);
});


function completeConsultation(button) {
    // Get the row of the clicked button
    var row = button.closest('tr');
    
    // Get the patient's name, date, and time from the row
    var patientName = row.cells[0].textContent;
    var appointmentDate = row.cells[1].textContent;
    var appointmentTime = row.cells[2].textContent;
    
    // Change the status of the appointment to "Completed"
    row.cells[3].innerHTML = '<span class="status-badge completed">Completed</span>';
    
    // Remove the "Complete" button and "Cancel" button
    row.cells[4].innerHTML = ''; // Assuming the buttons are in the 5th cell (index 4)

    // Create a new row for the patient in the "Patient Management" section
    var completedRow = document.createElement('tr');
    completedRow.innerHTML = `
        <td>${patientName}</td>
        <td>${appointmentDate}</td>
        <td>${appointmentTime}</td>
        <td><span class="status-badge completed">Completed</span></td>
        <td>
            <button class="btn-folder" onclick="openMedicalFolderModalview()">
                <i class="fas fa-folder-plus"></i> View Medical Folder
            </button>
        </td>
    `;
    
    // Append the new row to the "Patient Management" section
    document.getElementById('completedConsultationsBody').appendChild(completedRow);
    
    // Optionally, you can also remove the original row from the consultations table
    row.remove();
}

