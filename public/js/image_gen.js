// public/js/image_gen.js

document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const promptInput = document.getElementById('prompt');
    const imageCountInput = document.getElementById('imageCount');
    const aspectRatioSelect = document.getElementById('aspectRatio');
    const generateButton = document.getElementById('generateButton');
    // const genSpinner = document.getElementById('genSpinner'); // Not directly used, but its display is controlled
    const errorMessage = document.getElementById('errorMessage');
    const randomPromptBtn = document.getElementById('randomPromptBtn');
    const imageGrid = document.getElementById('imageGrid'); // Container for generated images
    const noImagesMessage = document.getElementById('noImagesMessage'); // Message for when no images exist
    const promptHistoryDropdown = document.getElementById('promptHistoryDropdown');

    // --- Sidebar Elements (from chat.js/dashboard.js, ensure sidebar.js loads them) ---
    const loggedInUsernameElem = document.getElementById('loggedInUsername');
    const logoutBtn = document.getElementById('logoutBtn');
    // For the sake of image_gen.html, the chat specific elements (newChatBtn, chatSessionsList)
    // are assumed to be managed by a separate 'sidebar.js' if they exist, or removed from the HTML.
    // This script will only interact with the logoutBtn and username display.

    // --- Utility functions (Assuming these are global or imported from a utils.js) ---
    // If these are not global, they need to be defined here or imported.
    // For this example, I'm defining them here for clarity, but ideally they'd be in a shared file.

    /**
     * Displays a custom modal with a title and message.
     * @param {string} title - The title of the modal.
     * @param {string} message - The message content of the modal.
     */
    const showCustomModal = (title, message) => {
        const modal = document.getElementById('customModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalMessage = document.getElementById('modalMessage');
        const modalOkButton = document.getElementById('modalOkButton');

        if (!modal || !modalTitle || !modalMessage || !modalOkButton) {
            console.error('Custom modal elements not found!');
            // Fallback to console log if modal elements are missing
            console.log(`${title}: ${message}`);
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
     * Toggles the loading state of the generate button and its spinner.
     * @param {boolean} isLoading - True to show loading state, false to hide.
     */
    const toggleLoading = (isLoading) => {
        const spinnerElement = document.getElementById('genSpinner'); // Use ID for direct access
        const buttonTextElement = generateButton.querySelector('.button-text'); // Get the text span

        if (isLoading) {
            generateButton.disabled = true;
            if (spinnerElement) spinnerElement.style.display = 'inline-block';
            if (buttonTextElement) buttonTextElement.textContent = ' Generating...';
        } else {
            generateButton.disabled = false;
            if (spinnerElement) spinnerElement.style.display = 'none';
            if (buttonTextElement) buttonTextElement.textContent = ' Generate Image';
        }
    };

    /**
     * Displays an error message on the page.
     * @param {string} message - The error message to display.
     */
    const displayError = (message) => {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
    };

    /**
     * Clears any displayed error message.
     */
    const clearError = () => {
        errorMessage.textContent = '';
        errorMessage.style.display = 'none';
    };

    /**
     * Handles token expiry by displaying a modal and redirecting to login.
     * @param {string} message - The message to display.
     */
    const handleTokenExpiry = (message) => {
        showCustomModal('Session Expired', message || 'Your session has expired. Please log in again.');
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        localStorage.removeItem('userId');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
    };

    // --- Authentication Check & UI Load ---
    const checkAuthAndLoadImageGen = () => {
        const token = localStorage.getItem('token');
        const username = localStorage.getItem('username');

        if (!token || !username) {
            handleTokenExpiry('You are not logged in. Please log in first.');
            return;
        }

        if (loggedInUsernameElem) {
            loggedInUsernameElem.textContent = username;
        }
    };

    // --- Image Download Function ---
    /**
     * Triggers the download of a generated image.
     * @param {string} imageUrl - The Base64 image URL to download.
     * @param {string} promptText - The original prompt for naming the file.
     */
    const downloadImage = (imageUrl, promptText) => {
        const link = document.createElement('a');
        link.href = imageUrl;
        // Sanitize prompt for filename and limit length
        const filename = promptText.substring(0, 50).replace(/[^\w\s]/gi, '_').replace(/ /g, '_') || 'generated_image';
        link.download = `${filename}.png`;
        document.body.appendChild(link); // Required for Firefox
        link.click();
        document.body.removeChild(link); // Clean up
    };

    // --- Function to Render a Single Image Card for History or New Generation ---
    /**
     * Creates and returns an HTML div element for a generated image card.
     * @param {Object} image - The image object containing imageUrl, prompt, etc.
     * @returns {HTMLDivElement} The created image card element.
     */
    const renderImageCard = (image) => {
        const imageCard = document.createElement('div');
        imageCard.classList.add('image-card');
        imageCard.dataset.prompt = image.prompt; // Store the prompt for filtering
        imageCard.style.display = 'none'; // Initially hide the card

        const imgElement = document.createElement('img');
        imgElement.src = image.imageUrl;
        imgElement.alt = image.prompt; // Alt text for accessibility
        imgElement.loading = 'lazy'; // Lazy load images for performance

        // Fallback for broken images
        imgElement.onerror = () => {
            imgElement.src = `https://placehold.co/400x300/e0e7ff/5a67d8?text=Image+Failed+to+Load`;
            imgElement.title = 'Image failed to load';
        };

        const promptSnippet = document.createElement('p');
        promptSnippet.classList.add('image-card-prompt-snippet');
        // Limit prompt display length for neatness
        const promptText = image.prompt || "Untitled";
        promptSnippet.textContent = promptText.length > 70 ? promptText.substring(0, 70) + '...' : promptText;


        const downloadBtn = document.createElement('button');
        downloadBtn.classList.add('download-button');
        downloadBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
        `;
        downloadBtn.title = `Download "${image.prompt}"`; // Tooltip
        downloadBtn.addEventListener('click', () => downloadImage(image.imageUrl, image.prompt));

        imageCard.appendChild(imgElement);
        imageCard.appendChild(promptSnippet);
        imageCard.appendChild(downloadBtn); // Add download button to card
        return imageCard;
    };

    // --- Function to Fetch and Display Image History ---
    /**
     * Fetches the user's generated image history and displays it in the image grid.
     */
    const fetchAndDisplayImageHistory = async () => {
        imageGrid.innerHTML = ''; // Clear existing images
        clearError(); // Clear any previous errors

        // Reset and prepare the prompt history dropdown
        const placeholderText = "-- Select a Prompt --";
        promptHistoryDropdown.innerHTML = ''; // Clear all options
        const defaultOption = document.createElement('option');
        defaultOption.value = "";
        defaultOption.textContent = placeholderText;
        promptHistoryDropdown.appendChild(defaultOption);
        promptHistoryDropdown.selectedIndex = 0; // Ensure placeholder is selected


        const token = localStorage.getItem('token');
        if (!token) {
            handleTokenExpiry('No token found. Please log in again.');
            noImagesMessage.textContent = "Please log in to see your image history.";
            noImagesMessage.style.display = 'block';
            promptHistoryDropdown.disabled = true;
            promptHistoryDropdown.options[0].textContent = "-- Please Log In --";
            return;
        }

        try {
            const response = await fetch('/api/imagegen/history', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch image history.');
            }

            const images = await response.json();

            if (images.length === 0) {
                noImagesMessage.style.display = 'block'; // Show "No images" message
                noImagesMessage.textContent = "No images generated yet. Start creating!"; // Set specific message
                promptHistoryDropdown.disabled = true; // Disable dropdown if no history
                promptHistoryDropdown.options[0].textContent = "-- No History Available --"; // Update placeholder
            } else {
                noImagesMessage.textContent = "Select a prompt to view images."; // New message
                noImagesMessage.style.display = 'block'; // Show this message initially
                promptHistoryDropdown.disabled = false; // Enable dropdown
                promptHistoryDropdown.options[0].textContent = placeholderText; // Reset placeholder text

                const uniquePrompts = new Set();
                images.forEach(image => {
                    const imageCard = renderImageCard(image);
                    imageGrid.appendChild(imageCard); // Append to show in fetched order (newest first)
                    uniquePrompts.add(image.prompt);
                });
                uniquePrompts.forEach(prompt => {
                    const option = document.createElement('option');
                    option.value = prompt;
                    // Truncate text for display if too long
                    option.textContent = prompt.length > 70 ? prompt.substring(0, 67) + '...' : prompt;
                    promptHistoryDropdown.appendChild(option);
                });
            }

        } catch (error) {
            console.error('Error fetching image history:', error);
            displayError(`Failed to load image history: ${error.message}`);
            noImagesMessage.textContent = `Error loading images: ${error.message}. Please try again later.`;
            noImagesMessage.style.display = 'block'; // Show message even on error
            promptHistoryDropdown.disabled = true;
            promptHistoryDropdown.options[0].textContent = "-- Error loading history --"; // Update placeholder
        }
    };


    // --- Function to Handle Image Generation ---
    /**
     * Handles the submission of the image generation form.
     * @param {Event} e - The form submission event.
     */
    const handleGenerateImage = async (e) => {
        e.preventDefault();
        clearError(); // Clear previous errors

        const prompt = promptInput.value.trim();
        const imageCount = parseInt(imageCountInput.value, 10);
        const aspectRatio = aspectRatioSelect.value;

        if (!prompt) {
            displayError('Please enter a prompt for the image.');
            return;
        }
        if (isNaN(imageCount) || imageCount < 1 || imageCount > 4) {
            displayError('Please enter a valid number of images (1-4).');
            return;
        }

        toggleLoading(true); // Show loading state

        const token = localStorage.getItem('token');
        if (!token) {
            handleTokenExpiry('No token found. Please log in again.');
            toggleLoading(false); // Hide loading state
            return;
        }

        try {
            const fetchPromises = [];
            for (let i = 0; i < imageCount; i++) {
                fetchPromises.push(fetch('/api/imagegen/generate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        prompt: prompt,
                        imageCount: 1, // Backend generates one at a time
                        aspectRatio: aspectRatio
                    }),
                }).then(async response => {
                    if (response.status === 401) {
                        throw new Error('Unauthorized: Session expired or invalid token.');
                    }
                    if (!response.ok) {
                        const errorBody = await response.json(); // Try to parse error message from body
                        throw new Error(errorBody.message || 'Server error during image generation.');
                    }
                    return response.json();
                }));
            }

            const results = await Promise.all(fetchPromises);

            let allSuccessful = true;
            results.forEach((data, index) => { // Check if all individual generations were successful
                if (data.imageUrl) {
                    // Images will be added by fetchAndDisplayImageHistory
                } else {
                    allSuccessful = false;
                    console.error(`Error generating image ${index + 1}:`, data.message || 'No image URL received.');
                    showCustomModal('Generation Error', `Could not generate image ${index + 1}. ${data.message || 'Please try a different prompt.'}`);
                }
            });

            // Refresh the history view to include the new images and update the dropdown
            if (results.length > 0) { // Only refresh if attempts were made
                await fetchAndDisplayImageHistory();
            }

        } catch (error) {
            console.error('Error generating images:', error);
            let userMessage = 'An unexpected error occurred during image generation.';
            if (error.message.includes('Unauthorized')) {
                handleTokenExpiry('Your session has expired. Please log in again.');
                return;
            } else if (error.message.includes('Server error')) {
                userMessage = `Image generation failed: ${error.message}`;
            } else if (error.message.includes('Network')) {
                userMessage = 'Network error. Please check your connection.';
            }
            displayError(userMessage);
            showCustomModal('Generation Failed', userMessage);
        } finally {
            toggleLoading(false); // Hide loading state
        }
    };

    // --- Random Prompt Function ---
    const randomPrompts = [
        "A fantastical cityscape at dawn, cyberpunk aesthetic",
        "An enchanted forest with glowing mushrooms and fireflies, fantasy art",
        "A majestic dragon soaring over a snowy mountain range, epic fantasy",
        "Underwater world with bioluminescent creatures and coral reefs, serene, vibrant",
        "A cozy coffee shop with a cat sleeping on a bookshelf, warm lighting, rainy day",
        "An astronaut planting a flag on a distant alien planet, vibrant nebulae in background",
        "A vintage car parked on a deserted road in the desert, retro style",
        "A peaceful Japanese garden with cherry blossoms and a koi pond, serene, tranquil",
        "Robots playing chess in a dimly lit, futuristic laboratory",
        "A whimsical treehouse deep in a magical forest, detailed, fairytale style"
    ];
    /**
     * Sets a random prompt in the prompt input field.
     */
    const getRandomPrompt = () => {
        const randomIndex = Math.floor(Math.random() * randomPrompts.length);
        promptInput.value = randomPrompts[randomIndex];
    };

    // --- Dark Mode Functionality ---
    /**
     * Applies the selected theme to the body.
     * @param {string} theme - 'dark' or 'light'.
     */
    function applyTheme(theme) {
        document.body.classList.toggle('dark-mode', theme === 'dark');
        // You might have a theme toggle button with an icon and text here too.
        // Example: const themeIcon = document.getElementById('themeIcon');
        // if (themeIcon) themeIcon.className = `fas ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`;
    }

    /**
     * Toggles between dark and light mode.
     */
    function toggleDarkMode() {
        const currentTheme = localStorage.getItem('theme') || 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('theme', newTheme);
        applyTheme(newTheme);
    }
    
    


    // --- Event Listeners ---
    // Apply saved theme on load
    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);

    // Initial authentication check and UI load
    checkAuthAndLoadImageGen();

    // Load previously generated images (history)
    fetchAndDisplayImageHistory();

    // Attach form submission listener
    document.getElementById('imageGenForm').addEventListener('submit', handleGenerateImage);

    // Attach random prompt button listener
    randomPromptBtn.addEventListener('click', getRandomPrompt);

    // Attach theme toggle button listener (assuming such a button exists in the HTML)
    // const themeToggleBtn = document.getElementById('themeToggleBtn');
    // if (themeToggleBtn) {
    //     themeToggleBtn.addEventListener('click', toggleDarkMode);
    // }

    // Attach logout event listener (from dashboard.js)
    if (logoutBtn) {
        // This 'handleLogout' function is expected to be global or imported from dashboard.js/utils.js
        // For robustness, consider defining a local handleLogout if dashboard.js isn't always present.
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('token');
            localStorage.removeItem('username');
            localStorage.removeItem('userId');
            window.location.href = 'login.html';
        });
    }

    // Attach modal close button listener
    const modalOkButton = document.getElementById('modalOkButton');
    if (modalOkButton) {
        modalOkButton.addEventListener('click', () => {
            document.getElementById('customModal').classList.remove('show');
        });
    }
    // Event listener for the prompt history dropdown
    if (promptHistoryDropdown) {
        promptHistoryDropdown.addEventListener('change', (event) => {
            const selectedPrompt = event.target.value;
            const allImageCards = imageGrid.querySelectorAll('.image-card');
            let imagesDisplayed = false;

            allImageCards.forEach(card => {
                if (selectedPrompt && card.dataset.prompt === selectedPrompt) {
                    card.style.display = 'flex'; // Or 'block' if that's the original display type
                    imagesDisplayed = true;
                } else {
                    card.style.display = 'none';
                }
            });

            if (selectedPrompt === "") { // "-- Select a Prompt --" is chosen
                noImagesMessage.textContent = "Select a prompt to view images.";
                noImagesMessage.style.display = 'block';
            } else if (imagesDisplayed) {
                noImagesMessage.style.display = 'none';
            } else {
                noImagesMessage.textContent = "No images found for this prompt."; // Should not happen if dropdown is populated correctly
                noImagesMessage.style.display = 'block';
            }

            if (promptInput && selectedPrompt) { // Also update the prompt input field
                promptInput.value = selectedPrompt;
            }
        });
    }

    // Initial state update for the generate button (ensures it's not disabled if JS loads late)
    toggleLoading(false);
});
