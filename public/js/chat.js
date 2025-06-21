// public/js/chat.js

// Variable to store the currently active chat session ID
let currentChatSessionId = null;

// Function to generate a simple unique ID for new sessions (UUID is better for production)
function generateSessionId() {
    return 'chat-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
}

// Function to display messages to the user (re-using from auth.js/dashboard.js)
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


// Function to check authentication and populate username
function checkAuthAndLoadChat() {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');

    if (!token || !username) {
        handleTokenExpiry('You are not logged in. Please log in first.');
        return;
    }

    const loggedInUsernameElem = document.getElementById('loggedInUsername');
    if (loggedInUsernameElem) {
        loggedInUsernameElem.textContent = username;
    }

    // Fetch and display sessions first
    fetchChatSessions(token);
}

// Function to handle logout (re-using from dashboard.js) - no change needed here.

// Function to add a message to the chat display
function addMessageToChat(message, sender) {
    const chatMessagesDiv = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message'); // main bubble style

    if (sender === 'user') {
        messageDiv.classList.add('user-message');
    } else {
        messageDiv.classList.add('ai-message');
    }

    messageDiv.textContent = message;
    chatMessagesDiv.appendChild(messageDiv);
    chatMessagesDiv.scrollTop = chatMessagesDiv.scrollHeight;
}


// Function to show/hide spinner
function showSpinner(show) {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
        if (show) {
            spinner.classList.add('show');
        } else {
            spinner.classList.remove('show');
        }
    }
}

// Function to handle token expiry and redirect
function handleTokenExpiry(message) {
    showMessageBox(message || 'Your session has expired. Please log in again.', true);
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('userId');
    setTimeout(() => {
        window.location.href = 'login.html';
    }, 1500);
}

// Function to display chat sessions in the sidebar
function displayChatSessions(sessions) {
    const chatSessionsList = document.getElementById('chatSessionsList');
    chatSessionsList.innerHTML = ''; // Clear existing list

    if (sessions && sessions.length > 0) {
        sessions.forEach(session => {
            const sessionItem = document.createElement('div'); // Create a container for link and delete button
            sessionItem.classList.add('chat-session-item'); // Add a class for styling

            const sessionLink = document.createElement('a');
            sessionLink.href = '#';
            sessionLink.classList.add('sidebar-link', 'chat-session-link');
            sessionLink.dataset.sessionId = session.sessionId;
            sessionLink.textContent = session.title || `Chat Session ${new Date(session.firstMessageTime).toLocaleDateString()}`;

            sessionLink.addEventListener('click', (event) => {
                event.preventDefault();
                loadChatSession(session.sessionId);
            });

            // NEW: Delete button for each session
            const deleteBtn = document.createElement('button');
            deleteBtn.classList.add('delete-session-btn');
            deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>'; // Font Awesome trash icon
            deleteBtn.title = `Delete "${session.title}" session`;
            deleteBtn.dataset.sessionId = session.sessionId; // Store session ID for deletion

            deleteBtn.addEventListener('click', (event) => {
                event.stopPropagation(); // Prevent the session link click from firing
                confirmAndDeleteSession(session.sessionId, session.title);
            });

            sessionItem.appendChild(sessionLink);
            sessionItem.appendChild(deleteBtn);
            chatSessionsList.appendChild(sessionItem);
        });

        // Auto-select the most recent session if no session is currently active
        // Or re-highlight the active one if the list was refreshed
        let sessionToLoad = sessions[0].sessionId; // Default to the most recent
        if (currentChatSessionId) {
            const foundActiveSession = sessions.find(s => s.sessionId === currentChatSessionId);
            if (foundActiveSession) {
                sessionToLoad = currentChatSessionId; // Keep current active if it still exists
            } else {
                // If current active session was deleted or no longer exists, load the most recent
                currentChatSessionId = null; // Reset it as it's no longer valid
            }
        }
        if (sessionToLoad && !document.querySelector(`.chat-session-link.active`)) {
             loadChatSession(sessionToLoad);
        }

    } else {
        chatSessionsList.innerHTML = '<p style="font-size: 0.85rem; color: #888; text-align: center;">No chat sessions found.</p>';
        handleNewChat(); // If no sessions, auto-create a new one
    }
}

// Function to fetch all chat sessions for the user
async function fetchChatSessions(token) {
    showSpinner(true);
    try {
        const response = await fetch('/api/chat/sessions', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            displayChatSessions(data.sessions);
        } else {
            if (response.status === 401) {
                handleTokenExpiry(data.message);
            } else {
                showMessageBox(data.message || 'Error fetching chat sessions.', true);
            }
        }
    } catch (error) {
        console.error('Error fetching chat sessions:', error);
        showMessageBox('An unexpected error occurred while loading chat sessions.', true);
    } finally {
        showSpinner(false);
    }
}

// Function to load messages for a specific chat session
async function loadChatSession(sessionIdToLoad) {
    currentChatSessionId = sessionIdToLoad; // Set the active session ID

    // Highlight the active session in the sidebar
    document.querySelectorAll('.chat-session-link').forEach(link => {
        link.classList.remove('active');
    });
    const activeLink = document.querySelector(`.chat-session-link[data-session-id="${sessionIdToLoad}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }

    const token = localStorage.getItem('token');
    if (!token) {
        handleTokenExpiry('No token found. Please log in again.');
        return;
    }

    showSpinner(true);
    try {
        const response = await fetch(`/api/chat/history/${sessionIdToLoad}`, { // Fetch history for specific session
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            const chatMessagesDiv = document.getElementById('chatMessages');
            chatMessagesDiv.innerHTML = ''; // Clear current messages
            if (data.history && data.history.length > 0) {
                data.history.forEach(msg => {
                    addMessageToChat(msg.message, msg.sender);
                });
            } else {
                addMessageToChat('Hello! How can I assist you in this session?', 'ai'); // Initial message for empty session
            }
        } else {
            if (response.status === 401) {
                handleTokenExpiry(data.message);
            } else {
                showMessageBox(data.message || 'Error fetching chat history.', true);
            }
        }
    } catch (error) {
        console.error('Error fetching chat history:', error);
        showMessageBox('An unexpected error occurred while loading chat history.', true);
    } finally {
        showSpinner(false);
    }
}

// NEW: Confirmation and deletion logic for chat sessions
async function confirmAndDeleteSession(sessionId, sessionTitle) {
    // Replace window.confirm with a custom modal/message box if not allowed.
    // For now, using a simple confirm for demonstration.
    const userConfirmed = confirm(`Are you sure you want to delete the chat session "${sessionTitle}"? This cannot be undone.`);

    if (userConfirmed) {
        await deleteChatSession(sessionId);
    }
}

async function deleteChatSession(sessionId) {
    showSpinner(true);
    const token = localStorage.getItem('token');
    if (!token) {
        handleTokenExpiry('No token found. Please log in again.');
        showSpinner(false);
        return;
    }

    try {
        const response = await fetch(`/api/chat/sessions/${sessionId}`, { // NEW DELETE endpoint
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            showMessageBox(data.message || 'Chat session deleted successfully!', false);
            // After deletion, refresh the session list
            await fetchChatSessions(token);

            // If the deleted session was the currently active one, start a new chat
            if (currentChatSessionId === sessionId) {
                currentChatSessionId = null; // Clear active session ID
                handleNewChat(); // Start a new empty chat
            } else {
                 // If the deleted session was not the active one, ensure current active is re-highlighted
                 const activeLink = document.querySelector(`.chat-session-link[data-session-id="${currentChatSessionId}"]`);
                 if (activeLink) {
                     activeLink.classList.add('active');
                 } else {
                     // If for some reason the active session is gone (e.g. from server side), load the first remaining.
                     await fetchChatSessions(token); // Re-fetch to auto-select latest
                 }
            }
        } else {
            if (response.status === 401) {
                handleTokenExpiry(data.message);
            } else {
                showMessageBox(data.message || 'Error deleting chat session.', true);
            }
        }
    } catch (error) {
        console.error('Error deleting chat session:', error);
        showMessageBox('An unexpected error occurred during session deletion.', true);
    } finally {
        showSpinner(false);
    }
}

// Function to handle sending a chat message
async function sendChatMessage(event) {
    event.preventDefault();

    const chatInput = document.getElementById('chatInput');
    const message = chatInput.value.trim();

    if (!message) {
        showMessageBox('Please enter a message to chat.', true);
        return;
    }

    // Ensure there's an active session before sending a message
    if (!currentChatSessionId) {
        await handleNewChat(true); // true means internal call, don't show message box
    }

    addMessageToChat(message, 'user');
    chatInput.value = '';
    showSpinner(true);

    const token = localStorage.getItem('token');
    if (!token) {
        handleTokenExpiry('No token found. Please log in again.');
        showSpinner(false);
        return;
    }

    try {
        const response = await fetch('/api/chat/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ message, sessionId: currentChatSessionId }), // Include sessionId
        });

        const data = await response.json();

        if (response.ok) {
            addMessageToChat(data.reply, 'ai');
            // After sending a message, refresh the sessions list to update titles/timestamps
            fetchChatSessions(token);
        } else {
            if (response.status === 401) {
                handleTokenExpiry(data.message);
            } else {
                showMessageBox(data.message || 'Error communicating with AI.', true);
                addMessageToChat(`Error: ${data.message || 'Failed to get AI response.'}`, 'ai');
            }
        }
    } catch (error) {
        console.error('Error sending chat message:', error);
        showMessageBox('An unexpected error occurred during chat. Please try again.', true);
        addMessageToChat('Error: Could not connect to AI service.', 'ai');
    } finally {
        showSpinner(false);
    }
}

// Function to handle 'New Chat' button click
// Accepts an optional 'internalCall' boolean to prevent showing messageBox
async function handleNewChat(internalCall = false) {
    const chatMessagesDiv = document.getElementById('chatMessages');
    chatMessagesDiv.innerHTML = ''; // Clear messages

    const token = localStorage.getItem('token');
    if (!token) {
        handleTokenExpiry('No token found. Please log in again.');
        return;
    }

    showSpinner(true);
    try {
        const response = await fetch('/api/chat/session', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (response.ok && data.sessionId) {
            currentChatSessionId = data.sessionId;

            addMessageToChat('Hello! How can I assist you in this new session?', 'ai');

            if (!internalCall) {
                showMessageBox('Started a new chat session.', false);
            }

            await fetchChatSessions(token); // Refresh sidebar
            const activeLink = document.querySelector(`.chat-session-link[data-session-id="${currentChatSessionId}"]`);
            if (activeLink) {
                activeLink.classList.add('active');
            }
        } else {
            showMessageBox(data.message || 'Failed to start new session.', true);
        }
    } catch (error) {
        console.error('Error creating new chat session:', error);
        showMessageBox('Error starting a new session.', true);
    } finally {
        showSpinner(false);
    }
}



// Attach event listeners when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication and load user data on page load
    checkAuthAndLoadChat();

    // Attach form submission listener
    const chatForm = document.getElementById('chatForm');
    if (chatForm) {
        chatForm.addEventListener('submit', sendChatMessage);
    }

    // Attach logout event listener (re-using the one from dashboard.js)
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // Attach 'New Chat' button listener
    const newChatBtn = document.getElementById('newChatBtn');
    if (newChatBtn) {
        newChatBtn.addEventListener('click', handleNewChat);
    }
});
