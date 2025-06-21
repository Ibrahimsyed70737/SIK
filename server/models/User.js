// server/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // For password hashing

// Define the User schema
const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Please enter a username'], // Username is required
        unique: true, // Each username must be unique
        trim: true, // Remove whitespace from both ends of a string
        minlength: [3, 'Username must be at least 3 characters long'] // Minimum length for username
    },
    email: {
        type: String,
        required: [true, 'Please enter an email'], // Email is required
        unique: true, // Each email must be unique
        trim: true,
        lowercase: true, // Store emails in lowercase
        match: [/.+@.+\..+/, 'Please enter a valid email address'] // Basic email regex validation
    },
    password: {
        type: String,
        required: [true, 'Please enter a password'], // Password is required
        minlength: [6, 'Password must be at least 6 characters long'] // Minimum length for password
    },
    createdAt: {
        type: Date,
        default: Date.now // Automatically set the creation date
    }
});

// Middleware to hash the password before saving the user
// 'pre' hook runs before a document is saved to the database
UserSchema.pre('save', async function(next) {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) {
        return next();
    }
    try {
        // Generate a salt (a random string) with a cost factor of 10
        // The cost factor determines how much time is needed to perform a hash calculation
        const salt = await bcrypt.genSalt(10);
        // Hash the password using the generated salt
        this.password = await bcrypt.hash(this.password, salt);
        next(); // Proceed to save the user
    } catch (err) {
        next(err); // Pass any error to the next middleware
    }
});

// Method to compare entered password with hashed password in the database
UserSchema.methods.comparePassword = async function(candidatePassword) {
    // Use bcrypt.compare to compare the provided password with the hashed password
    return await bcrypt.compare(candidatePassword, this.password);
};

// Create the User model from the schema
const User = mongoose.model('User', UserSchema);

module.exports = User;
