// ==========================


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
        newRow.innerHTML = `
            <td>${patientId}</td>
            <td>${patientName}</td>
            <td>${testType}</td>
            <td>${date}</td>
            <td><span class="status-badge completed">Completed</span></td>
        `;

        currentTestRow.remove();
        fileInput.value = '';
        closeImportPopup();
        alert('Test results imported successfully and moved to completed tests!');
    }
};

const closeImportPopup = () => {
    document.getElementById('importResultsPopup').style.display = 'none';
    currentTestRow = null;
};

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
