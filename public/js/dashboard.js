// public/js/dashboard.js

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

// Function to check authentication on page load
function checkAuthAndLoadDashboard() {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    const userId = localStorage.getItem('userId');

    if (!token || !username || !userId) {
        // If no token, redirect to login page
        showMessageBox('You are not logged in. Please log in first.', true);
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500); // Give a little time for message to be seen
        return;
    }

    // Display username and userId on the dashboard
    const dashboardUsernameElem = document.getElementById('dashboardUsername');
    const dashboardUserIdElem = document.getElementById('dashboardUserId');

    if (dashboardUsernameElem) {
        dashboardUsernameElem.textContent = username;
    }
    if (dashboardUserIdElem) {
        dashboardUserIdElem.textContent = userId;
    }
}

// Function to handle logout
function handleLogout() {
    // Remove token and user info from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('userId');

    showMessageBox('You have been logged out successfully.', false);
    // Redirect to the login page
    setTimeout(() => {
        window.location.href = 'login.html';
    }, 1500);
}

// Attach event listeners when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication status and load dashboard content
    checkAuthAndLoadDashboard();

    // Attach logout event listener
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
});
