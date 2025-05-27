// ==========================

// ==========================
// 2. Import Results Popup
// ==========================
let currentTestRow = null;

// Open import popup and store reference to the clicked row
function openImportPopup(button) {
    currentTestRow = button.closest('tr');
    document.getElementById('importResultsPopup').style.display = 'block';
}

// Close import popup
function closeImportPopup() {
    document.getElementById('importResultsPopup').style.display = 'none';
    document.getElementById('resultsFile').value = '';
    currentTestRow = null;
}

// Handle file import confirmation
function confirmImport() {
    const fileInput = document.getElementById('resultsFile');
    if (!fileInput.files[0]) {
        alert('Please select a file');
        return;
    }

    if (currentTestRow) {
        const testRequestId = currentTestRow.cells[0].textContent.replace('#', '');
        
        // Create form data to send file
        const formData = new FormData();
        formData.append('file', fileInput.files[0]);
        formData.append('test_request_id', testRequestId);
        
        // Send request to backend
        fetch('/lab/test/import', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('access_token')
            },
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Move test to completed section
            const patientId = currentTestRow.cells[0].textContent;
            const patientName = currentTestRow.cells[1].textContent;
            const testType = currentTestRow.cells[2].textContent;
            const date = currentTestRow.cells[3].textContent;

            const completedTable = document.getElementById('completedTestsTableBody');
            const newRow = completedTable.insertRow();
            newRow.innerHTML = `
                <td>${patientId}</td>
                <td>${patientName}</td>
                <td>${testType}</td>
                <td>${date}</td>
                <td><span class="status-badge completed">Completed</span></td>
                <td>
                    <button class="action-btn view-btn">
                        <i class="fas fa-eye"></i>
                        View
                    </button>
                </td>
            `;

            currentTestRow.remove();
            fileInput.value = '';
            closeImportPopup();
            alert('Test results imported successfully!');
        })
        .catch(error => {
            console.error('Error importing test results:', error);
            alert('Failed to import test results. Please try again.');
        });
    }
}

// ==========================
// 3. Dashboard Navigation
// ==========================

const sections = {
    dashboard: document.getElementById('dashboard-section'),
    'pending-tests': document.getElementById('pending-tests-section'),
    'completed-tests': document.getElementById('completed-tests-section'),
    'book-appointments': document.getElementById('book-appointments-section'),
    'view-appointments': document.getElementById('view-appointments-section')
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

// Fix the initialization error by removing the reference to initializeAIButtons
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is authenticated
    const token = localStorage.getItem('access_token');
    if (!token) {
        window.location.href = '/lab/login';
        return;
    }
    
    // Load any necessary data
    loadProfileData();
});
