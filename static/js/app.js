// for navbar scroll
 window.addEventListener("scroll", function(){
var navbar = document.getElementById("navbar"); //get the navbar 
if(window.scrollY > 50 ){
  navbar.classList.add("scrolled"); //add to class
}else{
  navbar.classList.remove("scrolled"); // remove from class
 }
 })

//for sign up
function prevStep(currentStep) {
  const section = document.getElementById(`section${currentStep}`);
  const prevSection = document.getElementById(`section${currentStep - 1}`);

  section.classList.add("hidden");
  prevSection.classList.remove("hidden");

  document.getElementById(`step${currentStep}`).classList.remove("active-step");
  document.getElementById(`step${currentStep - 1}`).classList.add("active-step");
}

function nextStep(currentStep) {
    const section = document.getElementById(`section${currentStep}`);
    const requiredFields = section.querySelectorAll("input[required], select[required], textarea[required]");
    let isValid = true;

    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            isValid = false;
            field.classList.add("is-invalid");
            field.reportValidity();
        } else {
            field.classList.remove("is-invalid");
        }
    });

    if (currentStep === 3) {
      const pass = section.querySelectorAll('input[type="password"]')[0].value;
      const confirm = section.querySelectorAll('input[type="password"]')[1].value;
      const errorDiv = document.getElementById("password-error");
    
      if (pass !== confirm) {
        isValid = false;
        errorDiv.style.display = "block";
        section.querySelectorAll('input[type="password"]')[1].classList.add("is-invalid");
      } else {
        errorDiv.style.display = "none";
        section.querySelectorAll('input[type="password"]')[1].classList.remove("is-invalid");
      }
    }

    if (isValid) {
        section.classList.add("hidden");
        document.getElementById(`step${currentStep}`).classList.remove("active-step");

        const nextSection = document.getElementById(`section${currentStep+1}`);
        nextSection.classList.remove("hidden");
        document.getElementById(`step${currentStep+1}`).classList.add("active-step");
    }
}


// Get the current date
// let currentDate = new Date();

// // Format the date to d/m/y
// let formattedDate = `${currentDate.getDate()}/${currentDate.getMonth() + 1}/${currentDate.getFullYear()}`;

// // Send the formatted date to the backend
// console.log(formattedDate);  // Output: "18/4/2025"



let currentDate = new Date();

// Format the date to d/m/y, ensuring two digits for day and month
let formattedDate = `${String(currentDate.getDate()).padStart(2, '0')}/${String(currentDate.getMonth() + 1).padStart(2, '0')}/${currentDate.getFullYear()}`;

// Ensure that the formattedDate is properly assigned before the log
console.log(formattedDate);  // Output: "18/04/2025"
