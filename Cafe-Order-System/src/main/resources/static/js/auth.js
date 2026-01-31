let isLogin = true;

function toggleForm() {
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");

    const leftIcon = document.getElementById("leftIcon");
    const leftTitle = document.getElementById("leftTitle");
    const leftText = document.getElementById("leftText");
    const leftBtnIcon = document.getElementById("leftBtnIcon");
    const leftBtnText = document.getElementById("leftBtnText");

    if (isLogin) {
        // Show Register
        loginForm.style.display = "none";
        registerForm.style.display = "block";

        leftIcon.className = "bi bi-person-plus-fill auth-logo";
        leftTitle.innerText = "Staff Registration";
        leftText.innerText = "Create an account for cafe employees.";
        leftBtnIcon.className = "bi bi-box-arrow-in-right";
        leftBtnText.innerText = " Login";
    } else {
        // Show Login
        loginForm.style.display = "block";
        registerForm.style.display = "none";

        leftIcon.className = "bi bi-cup-hot-fill auth-logo";
        leftTitle.innerText = "Cafe Order System";
        leftText.innerText = "Staff login to manage orders and billing.";
        leftBtnIcon.className = "bi bi-person-plus";
        leftBtnText.innerText = " Register";
    }

    isLogin = !isLogin;
}

function calculateAge(dob) {
    const birthDate = new Date(dob);
    const today = new Date();

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    document.getElementById("age").value = age;
}
