
//function close
function closeAiModal(){
    document.getElementById('aiModal').style.display = 'none';
    document.getElementById('aiModal').style.opacity = '0';
    document.getElementById('aiModal').style.transform = 'translateY(-20px)';
}
function sendAiMessage(){
    const messageElement = document.getElementById('aiMessages');

    messageElement.style.display = 'block';
    messageElement.className = 'modal-message info';
    messageElement.textContent = 'analyse ...';

    setTimeout(() => {
        messageElement.className = 'modal-message success';
        messageElement.textContent = 'analyse succès';
        setTimeout(() => {
            closeAiModal();
        }, 2000);
    }, 2000);

    

}
//sidebar toggle
document.addEventListener('DOMContentLoaded', function() {

    
    // Function to initialize AI button functionality
    function initializeAiButtons() {
        document.querySelectorAll('.aiBtn').forEach(button => {
            button.addEventListener('click', function() {
                // Display the modal
                const aiModal = document.getElementById('aiModal');
                aiModal.style.display = 'block';
                aiModal.style.opacity = '1';
                aiModal.style.transform = 'translateY(0)';
            });
        });
    }

    // Initialize AI buttons on initial load
    initializeAiButtons();

    // Toggle sidebar minimized state
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    const logo = document.querySelector('.logo-wrapper img');
    const navTexts = document.querySelectorAll('.nav-text');
    
    sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('minimized');
        mainContent.classList.toggle('expanded');
        
        // Toggle logo size with animation
        if (sidebar.classList.contains('minimized')) {
            logo.style.width = '40px';
            logo.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        } else {
            logo.style.width = '150px';
            logo.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        }
        
        // Animate nav text
        navTexts.forEach(text => {
            if (sidebar.classList.contains('minimized')) {
                text.style.opacity = '0';
                text.style.width = '0';
                text.style.marginLeft = '0';
            } else {
                text.style.opacity = '1';
                text.style.width = 'auto';
                text.style.marginLeft = '10px';
            }
        });
        
        // Rotate the chevron icon
        const icon = sidebarToggle.querySelector('i');
        icon.classList.toggle('fa-chevron-left');
        icon.classList.toggle('fa-chevron-right');
    });

    // Initialize sidebar state
    function initializeSidebar() {
        if (window.innerWidth <= 992) {
            sidebar.classList.add('minimized');
            mainContent.classList.add('expanded');
            logo.style.width = '40px';
            navTexts.forEach(text => {
                text.style.opacity = '0';
                text.style.width = '0';
                text.style.marginLeft = '0';
            });
        } else {
            sidebar.classList.remove('minimized');
            mainContent.classList.remove('expanded');
            logo.style.width = '150px';
            navTexts.forEach(text => {
                text.style.opacity = '1';
                text.style.width = 'auto';
                text.style.marginLeft = '10px';
            });
        }
    }

    window.addEventListener('resize', initializeSidebar);
    initializeSidebar();


      // Fullscreen toggle functionality
      const fullscreenToggle = document.querySelector('.fullscreen-toggle');
      const fullscreenIcon = fullscreenToggle.querySelector('i');
      
      fullscreenToggle.addEventListener('click', () => {
          if (!document.fullscreenElement) {
              document.documentElement.requestFullscreen();
              fullscreenIcon.classList.remove('fa-expand');
              fullscreenIcon.classList.add('fa-compress');
          } else {
              if (document.exitFullscreen) {
                  document.exitFullscreen();
                  fullscreenIcon.classList.remove('fa-compress');
                  fullscreenIcon.classList.add('fa-expand');
              }
          }
      });
      
      // Handle fullscreen change event
      document.addEventListener('fullscreenchange', () => {
        if (!document.fullscreenElement) {
            fullscreenIcon.classList.remove('fa-compress');
            fullscreenIcon.classList.add('fa-expand');
        }
    });


     // Gestion du profil et des notifications
     const profile = document.querySelector('.user-profile');
     const dropdown = document.querySelector('.profile-dropdown');

     profile.onclick = function(e) {
         e.stopPropagation();
         dropdown.classList.toggle('active');
     };

     document.onclick = function(e) {
         if (!dropdown.contains(e.target)) {
             dropdown.classList.remove('active');
         }
     };

 });


 
// 1. Dashboard Navigation

const sections = {
    dashboard: document.getElementById('dashboard-section'),
    'pending-tests': document.getElementById('pending-tests-section'),
    'completed-tests': document.getElementById('completed-tests-section'),
    'book-appointments': document.getElementById('book-appointments-section'),
    'view-appointments': document.getElementById('view-appointments-section'),
    'myschedule': document.getElementById('myschedule-section'),
    'pending-consultation': document.getElementById('pending-consultation-section'),
    'completed-consultation': document.getElementById('completed-consultation-section'),
    'upcoming-appointments': document.getElementById('upcoming-appointments-section'),
    'patient-management': document.getElementById('patient-management-section'),
    'medical-records-section': document.getElementById('medical-records-section')

};

const navLinks = document.querySelectorAll('.nav-links a');
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const sectionId = link.getAttribute('data-section');

        Object.values(sections).forEach(sec => {
            if (sec) sec.style.display = 'none';
        });

        if (sections[sectionId]) {
            sections[sectionId].style.display = 'block';
        }

        navLinks.forEach(l => l.parentElement.classList.remove('active'));
        link.parentElement.classList.add('active');
    });
});


   // 1. Update Profile Modal
// ==========================
const openUpdateModal = (event) => {
    event.preventDefault();
    const modal = document.getElementById('updateProfileModal');
    modal.style.display = 'block';
    modal.offsetHeight; // Force reflow
    modal.style.opacity = '1';
    modal.querySelector('div').style.transform = 'translateY(0)';
    document.querySelector('.profile-dropdown').classList.remove('active');
};

const closeUpdateModal = () => {
    const modal = document.getElementById('updateProfileModal');
    modal.style.opacity = '0';
    modal.querySelector('div').style.transform = 'translateY(-20px)';
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
};

const handleProfileImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('modalProfileImage').src = e.target.result;
            document.querySelector('.user-profile img').src = e.target.result;
            localStorage.setItem('laboratoryProfileImage','doctorProfileImage', e.target.result);
            showToast('Profile image updated successfully!');

        };
        reader.readAsDataURL(file);
    }
};

const saveProfile = () => {
    const currentImage = document.getElementById('modalProfileImage').src;
    const labName = document.getElementById('labNameInput').value;

    const formData = {
        profileImage: currentImage,
        laboratoryName: labName,
        email: document.querySelector('#updateProfileForm input[type="email"]').value,
        phone: document.querySelector('#updateProfileForm input[type="tel"]').value,
        address: document.querySelector('#updateProfileForm textarea').value,

    };

    // Save data to localStorage
    localStorage.setItem('laboratoryProfileData', JSON.stringify(formData));

    // Update the displayed lab name
    document.getElementById('labDisplayName').textContent = labName;

    closeUpdateModal();

};


// Load saved profile data on page load
document.addEventListener('DOMContentLoaded', () => {
    const savedData = localStorage.getItem('laboratoryProfileData');
    const savedImage = localStorage.getItem('laboratoryProfileImage');

    if (savedData) {
        const data = JSON.parse(savedData);
        document.querySelector('#updateProfileForm input[type="email"]').value = data.email || '';
        document.querySelector('#updateProfileForm input[type="tel"]').value = data.phone || '';
        document.querySelector('#updateProfileForm textarea').value = data.address || '';
        document.getElementById('labNameInput').value = data.laboratoryName || '';
        document.getElementById('labDisplayName').textContent = data.laboratoryName || 'DefaultName';
    }

    if (savedImage) {
        document.getElementById('modalProfileImage').src = savedImage;
        document.querySelector('.user-profile img').src = savedImage;
    }
    document.getElementById('labNameInput').addEventListener('input', (e) => {
        document.getElementById('labDisplayName').textContent = e.target.value || 'DefaultName';
        
    });
});
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

// Close modal when clicking outside
window.onclick = (event) => {
    if (event.target == document.getElementById('updateProfileModal')) {
        closeUpdateModal();
    }
};


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
        welcomeNameElement.textContent = ''; // Default name if no profile data
    }
});



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
    const notes = document.getElementById('notes').value;

    if (!testType) {
        alert('Please select a test type');
        return;
    }

    // Save test request
    const testRequest = {
        type: testType,
        date: new Date().toISOString()
    };

    // Save to localStorage
    let testRequests = JSON.parse(localStorage.getItem('testRequests') || '[]');
    testRequests.push(testRequest);
    localStorage.setItem('testRequests', JSON.stringify(testRequests));

    alert('Test request sent successfully');
    closeRecordModal();
};


// ==========================
// 2. Import Results Popup
// ==========================
let currentTestRow = null;

const openImportPopup = (button) => {
    currentTestRow = button.closest('tr');
    document.getElementById('importResultsPopup').style.display = 'flex';
};

const confirmImport = () => {
    const fileInput = document.getElementById('resultsFile');
    if (!fileInput.files[0]) {
        alert('Please select a file');
        return;
    }

    if (currentTestRow) {
        const patientId = currentTestRow.cells[0].textContent;
        const patientName = currentTestRow.cells[1].textContent;
        const testType = currentTestRow.cells[2].textContent;
        const date = currentTestRow.cells[3].textContent;

        const completedTable = document.getElementById('completedTestsTableBody');
        const newRow = completedTable.insertRow();
        
        // Create cells using DOM manipulation
        const cells = [];
        cells.push(newRow.insertCell(0)); // patientId
        cells.push(newRow.insertCell(1)); // patientName
        cells.push(newRow.insertCell(2)); // testType
        cells.push(newRow.insertCell(3)); // date
        cells.push(newRow.insertCell(4)); // status
        cells.push(newRow.insertCell(5)); // actions

        // Fill cells with content
        cells[0].textContent = patientId;
        cells[1].textContent = patientName;
        cells[2].textContent = testType;
        cells[3].textContent = date;
        
        // Create status badge
        const statusSpan = document.createElement('span');
        statusSpan.className = 'status-badge completed';
        statusSpan.textContent = 'Completed';
        cells[4].appendChild(statusSpan);

        // Create AI button
        const aiButton = document.createElement('button');
        aiButton.className = 'action-btn import-btn aiBtn';
        aiButton.innerHTML = '<i class="fas fa-robot"></i>IA';
        cells[5].appendChild(aiButton);

        // Add event listener to the new AI button
        aiButton.addEventListener('click', function() {
            const aiModal = document.getElementById('aiModal');
            aiModal.style.display = 'block';
            aiModal.style.opacity = '1';
            aiModal.style.transform = 'translateY(0)';
        });

        currentTestRow.remove();
        fileInput.value = '';
        closeImportPopup();
        alert('Test results imported successfully and moved to completed tests!');

        // Reinitialize AI buttons for all buttons in case there are multiple
        initializeAiButtons();
    }
};

const closeImportPopup = () => {
    document.getElementById('importResultsPopup').style.display = 'none';
    currentTestRow = null;
};





// Doctor availability data (this would typically come from your backend)
const doctorAvailability = {
    'dr1': ['2024-03-20', '2024-03-22', '2024-03-25'],
    'dr2': ['2024-03-21', '2024-03-23', '2024-03-26'],
    'dr3': ['2024-03-24', '2024-03-27', '2024-03-28']
};

// ====== Step-based Appointment Booking Logic ======
// 1. Enable 'Next' button when doctor is selected
const doctorSelect = document.getElementById('doctorSelect');
const nextToStep2Btn = document.getElementById('nextToStep2');

doctorSelect.addEventListener('change', function() {
    if (this.value) {
        nextToStep2Btn.disabled = false;
    } else {
        nextToStep2Btn.disabled = true;
    }
});

// 2. On 'Next', go to Step 2 and show available dates/times
nextToStep2Btn.addEventListener('click', function() {
    // Hide Step 1, show Step 2
    document.getElementById('step1').classList.remove('active');
    document.getElementById('step2').classList.add('active');

    // Show selected doctor's name in Step 2
    const selectedDoctorName = doctorSelect.options[doctorSelect.selectedIndex].text;
    document.getElementById('selectedDoctorName').textContent = selectedDoctorName;

    // Display available dates and times for this doctor
    const doctorId = doctorSelect.value;
    const calendarContainer = document.getElementById('doctorCalendar');
    calendarContainer.innerHTML = '';
    // Example: Display available dates as a list (replace with your calendar logic)
    if (doctorAvailability[doctorId]) {
        const list = document.createElement('ul');
        doctorAvailability[doctorId].forEach(date => {
            const li = document.createElement('li');
            li.textContent = `Date: ${date} | Time: 09:00 - 17:00`;
            list.appendChild(li);
        });
        calendarContainer.appendChild(list);
    } else {
        calendarContainer.textContent = 'No available dates for this doctor.';
    }
});

// ====== End of Step-based Logic ======

// (Commented old logic for date/time input, not used in step-based UI)
// document.getElementById('appointmentDate').disabled = true;
// document.getElementById('bookAppointmentForm').addEventListener('submit', ...);


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



function openViewModal(event) {
    event.preventDefault();
    const modal = document.getElementById('viewProfileModal');
    loadProfileData();
    modal.style.display = 'block';
    modal.offsetHeight; // Force reflow
    modal.style.opacity = '1';
    modal.querySelector('div').style.transform = 'translateY(0)';
    document.querySelector('.profile-dropdown').classList.remove('active');
}

function closeViewModal() {
    const modal = document.getElementById('viewProfileModal');
    modal.style.opacity = '0';
    modal.querySelector('div').style.transform = 'translateY(-20px)';
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
}

function loadProfileData() {
    // Récupérer les données du localStorage
    const doctorData = JSON.parse(localStorage.getItem('doctorData'));
    
    if (doctorData) {
        // Mettre à jour les champs du profil
        document.getElementById('viewFullName').textContent = doctorData.fullName || 'Not provided';
        document.getElementById('viewEmail').textContent = doctorData.email || 'Not provided';
        document.getElementById('viewPhone').textContent = doctorData.phone || 'Not provided';
        document.getElementById('viewSpecialty').textContent = doctorData.specialty || 'Not provided';
        document.getElementById('viewGender').textContent = doctorData.gender || 'Not provided';
        
        // Mettre à jour l'image de profil si disponible
        if (doctorData.profileImage) {
            document.getElementById('viewProfileImage').src = doctorData.profileImage;
        }
        
        // Mettre à jour le nom dans le header
        document.getElementById('labDisplayName').textContent = doctorData.fullName;
    }
}

// Charger les données au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    loadProfileData();
});

// Fermer le modal en cliquant en dehors
window.onclick = function(event) {
    const modal = document.getElementById('viewProfileModal');
    if (event.target == modal) {
        closeViewModal();
    }
}



