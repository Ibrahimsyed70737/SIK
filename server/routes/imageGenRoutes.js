// server/routes/imageGenRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const axios = require('axios'); // Replaced node-fetch with axios
const dotenv = require('dotenv');
const GeneratedImage = require('../models/GeneratedImage'); // Import the GeneratedImage model

dotenv.config();

/**
 * @route POST /api/imagegen/generate
 * @description Generate an image using the Hugging Face Inference API (Stable Diffusion XL)
 * @access Private (requires authentication)
 */
router.post('/generate', protect, async (req, res) => {
    const { prompt, aspectRatio } = req.body;
    const HUGGING_FACE_API_KEY = process.env.HUGGING_FACE_API_KEY;

    if (!prompt) {
        return res.status(400).json({ message: 'Image prompt is required' });
    }

    if (!HUGGING_FACE_API_KEY || HUGGING_FACE_API_KEY === "hf_YOUR_HUGGING_FACE_API_TOKEN" || HUGGING_FACE_API_KEY === "YOUR_HUGGING_FACE_API_TOKEN") {
        console.error('HUGGING_FACE_API_KEY is not set or is placeholder in .env');
        return res.status(500).json({ message: 'Server configuration error: Hugging Face API key missing or invalid.' });
    }

    // Determine image dimensions based on aspectRatio, mimicking frontend logic
    // These dimensions are common for Stable Diffusion XL models.
    let width, height;
    switch (aspectRatio) {
        case '1:1':
            width = 768; // Standard square size for higher quality
            height = 768;
            break;
        case '16:9':
            width = 1024; // Common landscape aspect ratio
            height = 576;
            break;
        case '9:16':
            width = 576; // Common portrait aspect ratio
            height = 1024;
            break;
        default: // Default to 1:1 if aspectRatio is not provided or unrecognized
            width = 768;
            height = 768;
            break;
    }

    // Define the Hugging Face model endpoint
    const modelId = "stabilityai/stable-diffusion-xl-base-1.0"; // As per your React reference
    const apiUrl = `https://api-inference.huggingface.co/models/${modelId}`;

    try {
        const payload = {
            inputs: prompt, // Hugging Face uses 'inputs' for the prompt
            parameters: {
                width: width,
                height: height,
                num_inference_steps: 50, // Standard parameter for SDXL
                guidance_scale: 7.5, // Standard parameter for SDXL
            },
            options: {
                wait_for_model: true, // Wait if the model is loading
                use_cache: true      // Use cached results if available
            }
        };

        const response = await axios.post(apiUrl, payload, {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${HUGGING_FACE_API_KEY}`,
                "Accept": "image/png" // NEW: Explicitly request PNG image type
            },
            responseType: 'arraybuffer' // Important for handling image binary data
        });

        // The Hugging Face API returns a binary image, not JSON with base64
        const imageBuffer = Buffer.from(response.data, 'binary');
        const imageUrl = `data:image/png;base64,${imageBuffer.toString('base64')}`;

        // Save generated image details to the database
        const newImage = await GeneratedImage.create({
            userId: req.user.id, // User ID from auth middleware
            prompt: prompt,
            imageUrl: imageUrl,
            aspectRatio: aspectRatio,
        });

        res.status(200).json({ imageUrl: imageUrl, imageId: newImage._id }); // Return imageId if needed

    } catch (error) {
        console.error('Error communicating with Hugging Face API:', error.message);
        let errorMessage = 'Error processing image generation request.';

        if (error.response) {
            console.error('Hugging Face API Error Response Status:', error.response.status);
            // Attempt to parse error data if it's not a direct image buffer (e.g., JSON error from HF)
            try {
                const errorDetails = Buffer.from(error.response.data).toString('utf8');
                console.error('Hugging Face API Error Response Data:', errorDetails);

                if (error.response.status === 401 || error.response.status === 403) {
                    errorMessage = `Authentication/Permission error: Please check your Hugging Face API token's validity and permissions on HuggingFace.co.`;
                } else if (error.response.status === 503) {
                    errorMessage = `Model loading error: The model might be loading or busy. Please try again in a moment. (Details: ${errorDetails.substring(0, Math.min(errorDetails.length, 100))})`;
                } else if (error.response.status === 429) {
                    errorMessage = `Rate limit exceeded: You are sending too many requests. Please wait and try again.`;
                } else {
                    errorMessage = `Hugging Face API error (Status: ${error.response.status}): ${errorDetails.substring(0, Math.min(errorDetails.length, 200))}`;
                }
            } catch (parseError) {
                errorMessage = `Hugging Face API error (Status: ${error.response.status}): Received non-text response.`;
            }

        } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
            errorMessage = 'Network connection error. Please check your internet connection.';
        } else {
            errorMessage = `An unexpected error occurred: ${error.message}`;
        }
        res.status(500).json({ message: errorMessage });
    }
});

/**
 * @route GET /api/imagegen/history
 * @description Get history of generated images for the authenticated user
 * @access Private (requires authentication)
 */
router.get('/history', protect, async (req, res) => {
    try {
        const images = await GeneratedImage.find({ userId: req.user.id })
                                            .sort({ timestamp: -1 }) // Sort by newest first
                                            .limit(50); // Limit to last 50 images for performance

        res.status(200).json(images);
    } catch (error) {
        console.error('Error fetching image history:', error);
        res.status(500).json({ message: 'Failed to fetch image history.' });
    }
});


module.exports = router;
