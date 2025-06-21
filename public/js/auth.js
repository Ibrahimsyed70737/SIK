// public/js/auth.js

// Function to display messages to the user (instead of alert)
function showMessageBox(message, isError = false) {
    const messageBox = document.getElementById('messageBox');
    if (!messageBox) {
        console.error('Message box element not found!');
        return;
    }
    messageBox.textContent = message;
    messageBox.className = 'messageBox'; // Reset classes
    if (isError) {
        messageBox.classList.add('error');
    }
    messageBox.classList.add('show');

    // Hide the message after 3 seconds
    setTimeout(() => {
        messageBox.classList.remove('show');
    }, 3000);
}

// Function to handle signup form submission
async function handleSignup(event) {
    event.preventDefault(); // Prevent default form submission

    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) {
        showMessageBox('Passwords do not match!', true);
        return;
    }

    try {
        const response = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, email, password }),
        });

        const data = await response.json();

        if (response.ok) {
            showMessageBox(data.message, false);
            // Store the token in localStorage for subsequent authenticated requests
            localStorage.setItem('token', data.token);
            localStorage.setItem('username', data.username); // Store username
            localStorage.setItem('userId', data.userId); // Store userId
            // Redirect to dashboard after successful signup
            window.location.href = 'dashboard.html';
        } else {
            // Display error message from the backend
            showMessageBox(data.message || 'Signup failed', true);
        }
    } catch (error) {
        console.error('Error during signup:', error);
        showMessageBox('An unexpected error occurred during signup. Please try again.', true);
    }
}

// Function to handle login form submission
async function handleLogin(event) {
    event.preventDefault(); // Prevent default form submission

    const emailOrUsername = document.getElementById('emailOrUsername').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ emailOrUsername, password }),
        });

        const data = await response.json();

        if (response.ok) {
            showMessageBox(data.message, false);
            // Store the token in localStorage
            localStorage.setItem('token', data.token);
            localStorage.setItem('username', data.username); // Store username
            localStorage.setItem('userId', data.userId); // Store userId
            // Redirect to dashboard after successful login
            window.location.href = 'dashboard.html';
        } else {
            // Display error message from the backend
            showMessageBox(data.message || 'Login failed', true);
        }
    } catch (error) {
        console.error('Error during login:', error);
        showMessageBox('An unexpected error occurred during login. Please try again.', true);
    }
}

// Attach event listeners when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check if the current page is signup.html and attach handler
    if (window.location.pathname.includes('signup.html')) {
        const signupForm = document.getElementById('signupForm');
        if (signupForm) {
            signupForm.addEventListener('submit', handleSignup);
        }
    }

    // Check if the current page is login.html and attach handler
    if (window.location.pathname.includes('login.html')) {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', handleLogin);
        }
    }
});

