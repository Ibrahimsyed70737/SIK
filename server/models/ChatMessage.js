// server/models/ChatMessage.js
const mongoose = require('mongoose');

// Define the ChatMessage schema
const ChatMessageSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId, // Link to the User model
        ref: 'User', // Reference the 'User' model
        required: true
    },
    sessionId: { // NEW: Field to group messages into sessions/conversations
        type: String, // A unique ID for each chat session (e.g., a UUID or timestamp-based ID)
        required: true
    },
    sender: {
        type: String,
        enum: ['user', 'ai'], // Messages can be from 'user' or 'ai'
        required: true
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    timestamp: {
        type: Date,
        default: Date.now // Automatically set the message timestamp
    }
});

// Create a compound index on userId, sessionId, and timestamp for efficient querying
ChatMessageSchema.index({ userId: 1, sessionId: 1, timestamp: 1 });

// Check if the model already exists before compiling it to prevent OverwriteModelError
const ChatMessage = mongoose.models.ChatMessage || mongoose.model('ChatMessage', ChatMessageSchema);

module.exports = ChatMessage;
