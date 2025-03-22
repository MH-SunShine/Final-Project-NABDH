// for navbar scroll

window.addEventListener("scroll", function(){
var navbar = document.getElementById("navbar"); //get the navbar 
if(window.scrollY > 50 ){
  navbar.classList.add("scrolled"); //add to class
}else{
  navbar.classList.remove("scrolled"); // reemove from class
}
})

// for animation signup signin 

var sign_in_btn = document.querySelector("#sign-in-btn");
var sign_up_btn = document.querySelector("#sign-up-btn");
var container= document.querySelector(".container-fluid");

sign_up_btn.addEventListener("click", function(){
  container.classList.add("sign-up-mode");
});

sign_in_btn.addEventListener("click", function(){
  container.classList.remove("sign-up-mode");
});


// for sign up form

document.addEventListener("DOMContentLoaded", function () {
    let currentStep = 1;
    const totalSteps = 4;
    const steps = document.querySelectorAll(".step");
    const progressSteps = document.querySelectorAll(".progress-step");

    function showStep(step) {
        steps.forEach( function(section, index) {
            section.classList.toggle("d-none", index !== step - 1);
        });

        progressSteps.forEach( function(circle, index) {
            circle.classList.toggle("active-step", index < step);
        });

        currentStep = step;
    }

    document.querySelectorAll(".next-btn").forEach( function(btn) {
        btn.addEventListener("click", function () {
            if (currentStep < totalSteps) {
                showStep(currentStep + 1);
            }
        });
    });

    document.querySelectorAll(".prev-btn").forEach( function(btn) {
        btn.addEventListener("click", function () {
            if (currentStep > 1) {
                showStep(currentStep - 1);
            }
        });
    });

    showStep(currentStep);
});

