# 🧠 SIK - AI-Powered Career Chatbot

SIK (Smart Intelligence Knowledgebot) is a full-stack AI-based career chatbot assistant designed to provide intelligent career guidance, resume analysis, and image generation using state-of-the-art APIs and AI models. It features a secure user authentication system, chat session history, voice interaction, and multimedia capabilities—all tailored for students and professionals.

---

## ✨ Features

* **User Authentication**: Secure sign-up and login system using hashed credentials.
* **ChatGPT-Like Chat Interface**: Smart, clean interface with “New Chat” support.
* **AI-Powered Responses**: Uses Google Gemini (or similar LLMs) to respond to queries.
* **Resume Analyzer**: Upload a resume (PDF), extract and analyze content for feedback.
* **Image Generation**: Prompt-based AI image generation using Hugging Face APIs.
* **Voice Assistant**: Optional voice-based input and response capability.
* **Chat History**: Stores chat history per user and allows revisiting past sessions.
* **MongoDB Integration**: Persists user data, chat history, and image prompts.

---

## 🚀 Technologies Used

### Backend:
- **Node.js**: JavaScript runtime for server-side logic.
- **Express.js**: Fast backend framework for REST APIs.
- **MongoDB**: NoSQL database for persistent storage.
- **Mongoose**: ODM for MongoDB.
- **dotenv**: Secure environment variable management.
- **bcryptjs**: Password hashing for user security.
- **jsonwebtoken (JWT)**: Token-based authentication.

### Frontend:
- **HTML5**: Markup language for structuring content.
- **CSS3**: Custom styling with responsive UI and animations.
- **Vanilla JavaScript**: Frontend logic and API interaction.
- **FontAwesome / Icons**: For visual enhancement.
- **Voice & Speech APIs**: Browser-based voice-to-text and TTS features.

---

## 📁 Project Structure

```plaintext
SIK/
├── client/                  # Frontend files
│   ├── index.html           # Main landing page
│   ├── login.html           # Login page
│   ├── signup.html          # Signup page
│   ├── chat.html            # Chat interface
│   ├── image_gen.html       # AI image generation page
│   ├── css/
│   │   └── style.css        # Global styles
│   └── js/
│       ├── main.js          # Chat logic
│       ├── auth.js          # Login/signup handling
│       └── image_gen.js     # Image generation logic
│
├── server/                  # Backend files
│   ├── models/              # Mongoose schemas (User, Chat, Image)
│   ├── routes/              # API route handlers
│   ├── controllers/         # Controller logic
│   ├── utils/               # Helper functions (e.g., PDF parsing)
│   ├── .env                 # (Ignored) API keys and MongoDB URI
│   └── server.js            # Express app setup
│
├── uploads/                 # Uploaded resumes/images
├── .gitignore               # Files to ignore during version control
├── README.md                # Project documentation
└── package.json             # Node project metadata
```

---

## 🏁 Getting Started

### Prerequisites

Ensure you have these tools installed:

- **Node.js** (v16+): [Install Node.js](https://nodejs.org)
- **MongoDB**: [Local or Atlas Setup](https://www.mongodb.com/cloud/atlas)
- **Git**: [Install Git](https://git-scm.com)

### Environment Variables

Create a `.env` file inside `/server`:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
HUGGINGFACE_API_KEY=your_huggingface_api_token
GEMINI_API_KEY=your_google_gemini_api_key
PORT=5000
```

---

### Installation Steps

1. **Clone the Repository**
   ```bash
   git clone https://github.com/Ibrahimsyed70737/SIK.git
   cd SIK
   ```

2. **Install Server Dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Install Frontend Dependencies** (if applicable)
   ```bash
   cd ../client
   # Normally no dependencies unless using a bundler like Vite
   ```

4. **Run the App**
   ```bash
   # In server/
   npm start
   ```

5. **Open in Browser**
   ```
   http://localhost:5000/
   ```

---

## 🔒 Security Note

- Do not commit `.env` files or secret keys.
- Make sure `.env` is listed in your `.gitignore`.

---

## 🙋 Usage

1. **Visit Home Page**: Sign up or log in.
2. **Chat**: Start a new chat session with the AI.
3. **Resume Analyzer**: Upload your resume and get personalized career feedback.
4. **Image Generator**: Enter a prompt to generate AI-based images.
5. **Chat History**: Click “New Chat” or revisit previous chats.

---

## 📬 Contact

Created by **Ibrahim Syed**  
GitHub: [@Ibrahimsyed70737](https://github.com/Ibrahimsyed70737)

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
