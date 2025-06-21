// server/routes/chatRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware'); // Import the protect middleware
const axios = require('axios'); // For making HTTP requests to external APIs
const dotenv = require('dotenv');
const ChatMessage = require('../models/ChatMessage'); // Import the ChatMessage model

dotenv.config(); // Load environment variables

/**
 * @route POST /api/chat/send
 * @description Send a message to the AI chatbot (Gemini API) and save to history
 * @access Private (requires authentication)
 */
router.post('/send', protect, async (req, res) => {
    // UPDATED: Now expect sessionId from the frontend
    const { message, sessionId } = req.body;
    const userId = req.user._id; // Get user ID from the protected route middleware
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!message || !sessionId) { // UPDATED: Validate sessionId
        return res.status(400).json({ message: 'Message content and session ID are required' });
    }

    if (!GEMINI_API_KEY) {
        console.error('GEMINI_API_KEY is not set in .env');
        return res.status(500).json({ message: 'Server configuration error: AI API key missing.' });
    }

    try {
        // Save user message to database
        const userMessage = new ChatMessage({
            userId: userId,
            sessionId: sessionId, // NEW: Include sessionId
            sender: 'user',
            message: message
        });
        await userMessage.save();

        let chatHistory = [];
        // For Gemini-2.0-flash, we typically send only the current turn unless specifically managing context.
        // If you want conversation context, you would fetch previous messages for this sessionId here:
        // const currentSessionMessages = await ChatMessage.find({ userId: userId, sessionId: sessionId })
        //                                                 .sort({ timestamp: 1 })
        //                                                 .limit(10) // Limit context to last few messages
        //                                                 .select('sender message');
        // chatHistory = currentSessionMessages.map(msg => ({
        //     role: msg.sender === 'user' ? 'user' : 'model',
        //     parts: [{ text: msg.message }]
        // }));
        chatHistory.push({ role: "user", parts: [{ text: message }] }); // Add current user message


        const payload = { contents: chatHistory };
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

        const response = await axios.post(apiUrl, payload, {
            headers: { 'Content-Type': 'application/json' }
        });

        const result = response.data; // Axios puts the JSON response in .data

        let aiResponseText = 'Failed to get AI response.';

        if (result.candidates && result.candidates.length > 0 &&
            result.candidates[0].content && result.candidates[0].content.parts &&
            result.candidates[0].content.parts.length > 0) {
            aiResponseText = result.candidates[0].content.parts[0].text;
            // Save AI message to database
            const aiMessage = new ChatMessage({
                userId: userId,
                sessionId: sessionId, // NEW: Include sessionId
                sender: 'ai',
                message: aiResponseText
            });
            await aiMessage.save();
            res.status(200).json({ reply: aiResponseText });
        } else {
            console.error('Gemini API response structure unexpected:', JSON.stringify(result, null, 2));
            // Even if AI response is unexpected, save an error message as AI's reply
            const aiMessage = new ChatMessage({
                userId: userId,
                sessionId: sessionId, // NEW: Include sessionId
                sender: 'ai',
                message: 'AI response failed or was unexpected.'
            });
            await aiMessage.save();
            res.status(500).json({ message: 'Failed to get a valid response from AI. Please try again.' });
        }

    } catch (error) {
        console.error('Error communicating with Gemini API:', error.message);
        // Save an error message as AI's reply if API call fails
        const aiMessage = new ChatMessage({
            userId: userId,
            sessionId: sessionId, // NEW: Include sessionId
            sender: 'ai',
            message: `Error: ${error.message || 'Unknown API error'}`
        });
        await aiMessage.save();

        if (error.response) {
            console.error('Gemini API Error Response:', error.response.data);
            res.status(error.response.status).json({
                message: error.response.data.message || 'Error processing AI chat request from API.'
            });
        } else {
            res.status(500).json({ message: 'Error processing AI chat request.' });
        }
    }
});

/**
 * @route GET /api/chat/history/:sessionId?
 * @description Get chat history for a specific session for the authenticated user
 * @access Private (requires authentication)
 */
router.get('/history/:sessionId?', protect, async (req, res) => { // UPDATED: Session ID is now optional
    const userId = req.user._id; // Get user ID from the protected route middleware
    const { sessionId } = req.params; // Get sessionId from URL parameters

    try {
        let query = { userId: userId };
        if (sessionId) {
            query.sessionId = sessionId; // Filter by sessionId if provided
        }

        const chatHistory = await ChatMessage.find(query)
                                            .sort({ timestamp: 1 }) // Sort by timestamp in ascending order
                                            .select('sender message timestamp sessionId'); // Select relevant fields

        res.status(200).json({ history: chatHistory });
    } catch (error) {
        console.error('Error fetching chat history:', error.message);
        res.status(500).json({ message: 'Error fetching chat history.' });
    }
});

/**
 * @route GET /api/chat/sessions
 * @description Get a list of unique chat sessions for the authenticated user
 * @access Private (requires authentication)
 */
router.get('/sessions', protect, async (req, res) => { // NEW ROUTE
    const userId = req.user._id;

    try {
        // Use MongoDB aggregation to get unique session IDs and their creation timestamp (or last message time)
        const sessions = await ChatMessage.aggregate([
            { $match: { userId: userId } }, // Filter by user
            { $sort: { timestamp: 1 } }, // Sort to find the first message in a session
            {
                $group: {
                    _id: "$sessionId", // Group by sessionId
                    firstMessageTime: { $first: "$timestamp" }, // Get timestamp of first message
                    lastMessageTime: { $last: "$timestamp" }, // Get timestamp of last message
                    // Optional: Get a snippet of the first user message for session title
                    firstUserMessage: {
                        $first: {
                            $cond: [{ $eq: ["$sender", "user"] }, "$message", null]
                        }
                    }
                }
            },
            { $sort: { lastMessageTime: -1 } }, // Sort sessions by most recent activity
            {
                $project: {
                    _id: 0, // Exclude _id from the final output
                    sessionId: "$_id",
                    firstMessageTime: 1,
                    lastMessageTime: 1,
                    // Take the first 50 characters of the first user message as a title, or a default
                    title: {
                        $substrCP: [
                            { $ifNull: ["$firstUserMessage", "New Chat"] },
                            0,
                            50
                        ]
                    }
                }
            }
        ]);

        res.status(200).json({ sessions: sessions });
    } catch (error) {
        console.error('Error fetching chat sessions:', error.message);
        res.status(500).json({ message: 'Error fetching chat sessions.' });
    }
});

/**
 * @route DELETE /api/chat/sessions/:sessionId
 * @description Delete a specific chat session and all its messages for the authenticated user
 * @access Private (requires authentication)
 */
router.delete('/sessions/:sessionId', protect, async (req, res) => { // NEW DELETE ROUTE
    const userId = req.user._id;
    const { sessionId } = req.params;

    if (!sessionId) {
        return res.status(400).json({ message: 'Session ID is required to delete chat.' });
    }

    try {
        // Delete all messages associated with this sessionId and userId
        const deleteResult = await ChatMessage.deleteMany({ userId: userId, sessionId: sessionId });

        if (deleteResult.deletedCount > 0) {
            res.status(200).json({ message: `Session '${sessionId}' and ${deleteResult.deletedCount} messages deleted successfully.` });
        } else {
            res.status(404).json({ message: 'No chat session found with that ID for the current user, or no messages to delete.' });
        }
    } catch (error) {
        console.error('Error deleting chat session:', error.message);
        res.status(500).json({ message: 'Error deleting chat session.' });
    }
});

/**
 * @route POST /api/chat/session
 * @description Create a new empty chat session (before any messages are sent)
 * @access Private
 */
router.post('/session', protect, async (req, res) => {
    const userId = req.user._id;

    // Generate a unique session ID
    const sessionId = `chat-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    try {
        // Save a placeholder message to create the session (optional)
        const systemGreeting = new ChatMessage({
            userId: userId,
            sessionId: sessionId,
            sender: 'ai',
            message: 'Hello! How can I assist you in this new session?'
        });
        await systemGreeting.save();

        res.status(201).json({ sessionId });
    } catch (error) {
        console.error('Error creating new session:', error.message);
        res.status(500).json({ message: 'Failed to create new chat session.' });
    }
});

module.exports = router;
