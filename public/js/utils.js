// public/js/utils.js

/**
 * Displays a custom modal with a title and message.
 * @param {string} title - The title of the modal.
 * @param {string} message - The message content of the modal.
 */
export const showCustomModal = (title, message) => {
    const modal = document.getElementById('customModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalMessage = document.getElementById('modalMessage');
    const modalOkButton = document.getElementById('modalOkButton');

    if (!modal || !modalTitle || !modalMessage || !modalOkButton) {
        console.error('Custom modal elements not found!');
        console.log(`${title}: ${message}`); // Fallback to console log
        return;
    }

    modalTitle.textContent = title;
    modalMessage.textContent = message;
    modal.classList.add('show'); // Make the modal visible

    const close = () => {
        modal.classList.remove('show');
        // Remove event listeners to prevent memory leaks/multiple attachments
        modalOkButton.removeEventListener('click', close);
        modal.removeEventListener('click', overlayClick);
    };

    const overlayClick = (e) => {
        if (e.target === modal) { // Close if clicked on overlay, not content
            close();
        }
    };

    modalOkButton.addEventListener('click', close);
    modal.addEventListener('click', overlayClick); // Allow clicking outside to close
};

/**
 * Toggles the loading state of a given button and its spinner.
 * Assumes the spinner is a child span with class 'spinner' and id 'genSpinner'
 * within the button.
 * @param {HTMLButtonElement} button - The button element to toggle.
 * @param {HTMLSpanElement} spinner - The spinner element within the button.
 * @param {boolean} isLoading - True to show loading state, false to hide.
 * @param {string} originalText - The original text of the button when not loading.
 */
export const toggleLoading = (button, spinner, isLoading, originalText) => {
    if (isLoading) {
        button.disabled = true;
        button.innerHTML = `<span class="spinner" id="genSpinner"></span> Loading...`;
        spinner.style.display = 'inline-block';
    } else {
        button.disabled = false;
        button.innerHTML = `<span class="spinner" id="genSpinner" style="display: none;"></span> ${originalText}`;
        spinner.style.display = 'none';
    }
};

/**
 * Displays an error message on a specified element.
 * @param {HTMLElement} errorElement - The element to display the error message in.
 * @param {string} message - The error message to display.
 */
export const displayError = (errorElement, message) => {
    errorElement.textContent = message;
    errorElement.style.display = 'block';
};

/**
 * Clears any displayed error message on a specified element.
 * @param {HTMLElement} errorElement - The element whose error message to clear.
 */
export const clearError = (errorElement) => {
    errorElement.textContent = '';
    errorElement.style.display = 'none';
};

/**
 * Handles token expiry by displaying a modal and redirecting to login.
 * @param {string} message - The message to display.
 */
export const handleTokenExpiry = (message) => {
    showCustomModal('Session Expired', message || 'Your session has expired. Please log in again.');
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('userId');
    setTimeout(() => {
        window.location.href = 'login.html';
    }, 1500);
};

/**
 * Generic logout function.
 */
export const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('userId');
    window.location.href = 'login.html';
};

/**
 * Applies the selected theme to the body.
 * @param {string} theme - 'dark' or 'light'.
 */
export function applyTheme(theme) {
    document.body.classList.toggle('dark-mode', theme === 'dark');
}

/**
 * Toggles between dark and light mode.
 */
export function toggleDarkMode() {
    const currentTheme = localStorage.getItem('theme') || 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
}
