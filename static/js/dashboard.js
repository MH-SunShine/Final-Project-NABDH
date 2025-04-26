//sidebar toggle
document.addEventListener('DOMContentLoaded', function() {
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
            localStorage.setItem('laboratoryProfileImage', e.target.result);
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

    // 🔁 Update the displayed lab name
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

// Close modal when clicking outside
window.onclick = (event) => {
    if (event.target == document.getElementById('updateProfileModal')) {
        closeUpdateModal();
    }
};

// Check authentication first
document.addEventListener('DOMContentLoaded', () => {
    console.log('Dashboard script loaded');
    const token = localStorage.getItem('access_token');
    console.log('Token found:', token ? 'Yes' : 'No');

    if (!token) {
        console.log('No token found, redirecting to login');
        window.location.replace('/patient/login');
        return;
    }

    // Add Authorization header to all fetch requests
    const originalFetch = window.fetch;
    window.fetch = function(url, options = {}) {
        options = options || {};
        options.headers = options.headers || {};
        options.headers['Authorization'] = `Bearer ${token}`;
        return originalFetch(url, options);
    };

    // Initialize the dashboard
    initializeDashboard();
});

// Rest of your existing dashboard code
function initializeDashboard() {
    // Toggle sidebar minimized state
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    const logo = document.querySelector('.logo-wrapper img');
    const navTexts = document.querySelectorAll('.nav-text');
    
    if (sidebarToggle) {
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
    }

    // Initialize sidebar state
    function initializeSidebarState() {
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

    window.addEventListener('resize', initializeSidebarState);
    initializeSidebarState();

    // Rest of your existing initialization code...
}

