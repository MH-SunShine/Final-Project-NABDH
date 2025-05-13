// // Signup form validation and submission
// document.addEventListener('DOMContentLoaded', () => {
//     const signupForm = document.getElementById('signup-form');
    
//     if (signupForm) {
//         signupForm.addEventListener('submit', async (event) => {
//             event.preventDefault();
            
//             try {
//                 // Validate passwords match
//                 const password = document.getElementById('password').value;
//                 const confirmPassword = document.getElementById('confirm_password').value;
                
//                 if (password !== confirmPassword) {
//                     alert('Passwords do not match!');
//                     return;
//                 }
                
//                 // Collect form data
//                 const formData = {};
//                 const formElements = signupForm.elements;
//                 for (let element of formElements) {
//                     if (element.name && element.value) {
//                         formData[element.name] = element.value.trim();
//                     }
//                 }
                
//                 // Determine the endpoint based on the current URL
//                 const currentPath = window.location.pathname.toLowerCase();
//                 let signupEndpoint = '';
                
//                 if (currentPath.includes('/doctor')) {
//                     signupEndpoint = '/doctor/signup';
//                 } else if (currentPath.includes('/lab')) {
//                     signupEndpoint = '/lab/signup';
//                 }
                
//                 // Send signup request
//                 const response = await fetch(signupEndpoint, {
//                     method: 'POST',
//                     headers: {
//                         'Content-Type': 'application/json',
//                     },
//                     body: JSON.stringify(formData),
//                 });

//                 const data = await response.json();

//                 if (response.ok) {
//                     // Show success message
//                     const signupSuccess = document.getElementById('signupSuccess');
//                     if (signupSuccess) {
//                         signupSuccess.style.display = 'block';
//                         // Hide the form
//                         signupForm.style.display = 'none';
//                     }
//                 } else {
//                     alert(data.msg || 'Signup failed. Please try again.');
//                 }
//             } catch (error) {
//                 console.error('Error during signup:', error);
//                 alert('An error occurred. Please try again.');
//             }
//         });
//     }
// }); 

// // Signup form validation and submission
// document.addEventListener('DOMContentLoaded', () => {
//     const signupForm = document.getElementById('signup-form');

//     if (signupForm) {
//         signupForm.addEventListener('submit', async (event) => {
//             event.preventDefault();

//             try {
//                 // Validate passwords match
//                 const password = document.getElementById('password').value;
//                 const confirmPassword = document.getElementById('confirm_password').value;

//                 if (password !== confirmPassword) {
//                     alert('Passwords do not match!');
//                     return;
//                 }

//                 // Collect form data
//                 const formData = {};
//                 const formElements = signupForm.elements;
//                 for (let element of formElements) {
//                     if (element.name && element.value.trim() !== '') {
//                         formData[element.name] = element.value.trim();
//                     }
//                 }

//                 // Check if fullname exists
//                 if (!formData.fullname) {
//                     alert('Full name is required.');
//                     return;
//                 }

//                 // Determine the endpoint based on the current URL
//                 const currentPath = window.location.pathname.toLowerCase();
//                 let signupEndpoint = '';

//                 if (currentPath.includes('/doctor')) {
//                     signupEndpoint = '/doctor/signup';
//                 } else if (currentPath.includes('/lab')) {
//                     signupEndpoint = '/lab/signup';
//                 } else if (currentPath.includes('/lab')) {
//                     signupEndpoint = '/lab/signup';
//                 }

//                 // Send signup request
//                 const response = await fetch(signupEndpoint, {
//                     method: 'POST',
//                     headers: {
//                         'Content-Type': 'application/json',
//                     },
//                     body: JSON.stringify(formData),
//                 });

//                 const data = await response.json();

//                 if (response.ok) {
//                     // Show success message
//                     const signupSuccess = document.getElementById('signupSuccess');
//                     if (signupSuccess) {
//                         signupSuccess.style.display = 'block';
//                         signupForm.style.display = 'none';
//                     }
//                 } else {
//                     alert(data.msg || 'Signup failed. Please try again.');
//                 }
//             } catch (error) {
//                 console.error('Error during signup:', error);
//                 alert('An error occurred. Please try again.');
//             }
//         });
//     }
// });


// Signup form validation and submission
document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signup-form');

    if (signupForm) {
        signupForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            try {
                // Validate passwords match
                const password = document.getElementById('password').value;
                const confirmPassword = document.getElementById('confirm_password').value;

                if (password !== confirmPassword) {
                    alert('Passwords do not match!');
                    return;
                }

                // Collect form data
                const formData = {};
                const formElements = signupForm.elements;
                for (let element of formElements) {
                    if (element.name && element.value.trim() !== '') {
                        formData[element.name] = element.value.trim();
                    }
                }

                // Basic required field check
                if (!formData.fullname) {
                    alert('Full name is required.');
                    return;
                }
                if (!formData.phone_number) {
                    alert('Phone number is required.');
                    return;
                }

                // Determine the endpoint based on the current URL
                const currentPath = window.location.pathname.toLowerCase();
                let signupEndpoint = '';

                if (currentPath.includes('/doctor')) {
                    signupEndpoint = '/doctor/signup';
                } else if (currentPath.includes('/lab')) {
                    signupEndpoint = '/lab/signup';
                } else if (currentPath.includes('/patient')) {
                    signupEndpoint = '/patient/signup';
                } else {
                    alert('Unknown signup type. URL must include /doctor, /lab or /patient.');
                    return;
                }

                // Send signup request
                const response = await fetch(signupEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData),
                });

                const data = await response.json();

                if (response.ok) {
                    // Show success message
                    const signupSuccess = document.getElementById('signupSuccess');
                    if (signupSuccess) {
                        signupSuccess.style.display = 'block';
                        signupForm.style.display = 'none';
                    }
                } else {
                    alert(data.msg || 'Signup failed. Please try again.');
                }
            } catch (error) {
                console.error('Error during signup:', error);
                alert('An error occurred. Please try again.');
            }
        });
    }
});
