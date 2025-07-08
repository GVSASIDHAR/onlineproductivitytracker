function togglePassword() {
    const passwordInput = document.getElementById('password');
    const toggleText = document.getElementById('togglePassword');

    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleText.textContent = 'Hide';
    } else {
        passwordInput.type = 'password';
        toggleText.textContent = 'Show';
    }
}

function showAlert(message, type = 'danger') {
    const alertBox = document.getElementById('alertBox');
    alertBox.innerHTML = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;

    // Auto-close after 3 seconds
    setTimeout(() => {
        alertBox.innerHTML = '';
    }, 3000);
}

// Check for success flag on page load
document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('loginSuccess') === 'true') {
        showAlert('Login Successful! Redirecting...', 'success');
        localStorage.removeItem('loginSuccess');

        // Optional: Delay actual redirection to simulate processing
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);
    }
});

document.getElementById('loginForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    if (email === '' || password === '') {
        showAlert('Please fill in all fields.', 'danger');
    } else {
        // Set success flag in localStorage
        localStorage.setItem('loginSuccess', 'true');
        // Refresh the page
        location.reload();
    }
});
