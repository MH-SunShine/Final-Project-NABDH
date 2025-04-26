// Handle login form submission
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    
    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            
            // Get form elements
            const button = document.getElementById('login-button');
            const buttonText = button.querySelector('.button-text');
            const spinner = button.querySelector('.spinner-border');
            const errorDiv = document.getElementById('login-error');
            
            try {
                // Show loading state
                button.disabled = true;
                buttonText.textContent = 'Logging in...';
                spinner.classList.remove('d-none');
                errorDiv.style.display = 'none';
                
                const email = document.getElementById('email').value.trim();
                const password = document.getElementById('password').value;

                // Determine user type from current URL
                const currentPath = window.location.pathname.toLowerCase();
                let loginEndpoint = '';
                let dashboardUrl = '';
                let userType = '';
                
                if (currentPath.includes('patient')) {
                    loginEndpoint = '/patient/login';
                    dashboardUrl = '/patient/dashboard';
                    userType = 'patient';
                } else if (currentPath.includes('doctor')) {
                    loginEndpoint = '/doctor/login';
                    dashboardUrl = '/doctor/dashboard';
                    userType = 'doctor';
                } else if (currentPath.includes('lab')) {
                    loginEndpoint = '/lab/login';
                    dashboardUrl = '/lab/dashboard';
                    userType = 'lab_staff';
                } else {
                    throw new Error('Unknown user type. Please use the correct login page.');
                }

                console.log('User type detected:', userType);
                console.log('Sending login request to:', loginEndpoint);

                const response = await fetch(loginEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, password }),
                });

                const data = await response.json();
                console.log('Login response:', { ...data, access_token: data.access_token ? '****' : undefined });

                if (response.ok && data.access_token) {
                    console.log('Login successful, storing token...');
                    localStorage.setItem('access_token', data.access_token);
                    localStorage.setItem('user_type', userType);
                    
                    // Make authenticated request to dashboard
                    console.log('Making authenticated request to dashboard...');
                    const dashboardResponse = await fetch(dashboardUrl, {
                        headers: {
                            'Authorization': `Bearer ${data.access_token}`
                        }
                    });

                    if (dashboardResponse.ok) {
                        const htmlContent = await dashboardResponse.text();
                        document.open();
                        document.write(htmlContent);
                        document.close();
                        history.pushState({}, '', dashboardUrl);
                    } else {
                        throw new Error('Failed to access dashboard');
                    }
                } else {
                    // Show error message
                    console.log('Login failed:', data.error || data.msg);
                    errorDiv.textContent = data.error || data.msg || 'Login failed. Please try again.';
                    errorDiv.style.display = 'block';
                }
            } catch (error) {
                console.error('Error during login:', error);
                // Show error message
                errorDiv.textContent = error.message || 'An error occurred. Please try again.';
                errorDiv.style.display = 'block';
            } finally {
                // Reset button state if we haven't redirected
                if (document.getElementById('login-form')) {
                    button.disabled = false;
                    buttonText.textContent = 'Log In';
                    spinner.classList.add('d-none');
                }
            }
        });
    }

    // Add global fetch interceptor for authenticated requests
    const originalFetch = window.fetch;
    window.fetch = function(url, options = {}) {
        options = options || {};
        options.headers = options.headers || {};
        
        // Add Authorization header if token exists
        const token = localStorage.getItem('access_token');
        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }
        
        return originalFetch(url, options);
    };
});

// Check for session expired parameter
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.has('session_expired')) {
    const errorDiv = document.getElementById('error-message');
    if (errorDiv) {
        errorDiv.textContent = 'Your session has expired. Please log in again.';
        errorDiv.style.display = 'block';
    }
} 