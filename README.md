# 🛡️ ShieldAI — AI-Powered Cyberbullying Detection

> Built by **Sameer Kumar** & **Jay Modak**

ShieldAI is a full-stack web application that uses an ensemble of machine learning models to detect cyberbullying, online harassment, and toxic language in real time. It supports text input, screenshot OCR, multi-platform analysis, and personalized safety alerts.

---

## ✨ Features

- **Triple ML Model Ensemble** — toxic-bert + twitter-roberta + zero-shot NLI working in parallel
- **Screenshot OCR** — upload a social media screenshot, extract the text, and analyze it
- **Multi-Platform Aware** — context-tuned detection for Facebook, Twitter/X, Instagram, and general text
- **Zero-Shot Classification** — catches sarcasm, social exclusion, and indirect bullying that keyword filters miss
- **Safety Email Alerts** — automatically emails logged-in users when high-severity content is detected
- **Analysis History** — Google OAuth login lets users view their past analyses in a dropdown
- **Dark Cyber UI** — consistent dark aesthetic with scroll animations and cursor effects across all pages
- **Educational Resources** — laws, crisis helplines, support tools, and awareness videos

---

## 🧠 How Detection Works

```
Input Text / Screenshot
        ↓
   Rule Engine (MongoDB keyword patterns)
        ↓
   toxic-bert          ← explicit slurs, threats, hate speech
   twitter-roberta     ← subtle social media bullying (trained on 58M tweets)
   zero-shot NLI       ← sarcasm, exclusion, indirect harassment
        ↓
   Weighted Ensemble Score
   (rule × 0.1 + toxic × 0.3 + roberta × 0.3 + zeroshot × 0.4)
        ↓
   Verdict: Safe / Suspicious / Cyberbullying
```

---

## 🗂️ Project Structure

```
shieldai/
├── frontend/                   # React + Vite
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Landing.jsx     # Hero landing page
│   │   │   ├── Home.jsx        # Main analyzer
│   │   │   ├── Resources.jsx   # Crisis resources
│   │   │   ├── Laws.jsx        # Cyberbullying laws
│   │   │   └── Videos.jsx      # Educational videos
│   │   ├── components/
│   │   │   └── Layout.jsx      # Header + footer + history
│   │   ├── context/
│   │   │   └── AuthContext.jsx # Shared user + theme state
│   │   ├── styles/
│   │   │   └── cyber.jsx       # Shared design system
│   │   └── App.jsx
│   ├── .env                    # ← NOT committed (see below)
│   └── vite.config.js
│
└── backend/                    # Flask + Python
    ├── app.py                  # API server
    ├── .env                    # ← NOT committed (see below)
    └── requirements.txt
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Python 3.9+
- MongoDB (running locally on port 27017)
- Tesseract OCR installed ([Windows installer](https://github.com/UB-Mannheim/tesseract/wiki))

---

### Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend/` folder:

```env
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id_here
VITE_API_URL=http://localhost:5000
```

Start the dev server:

```bash
npm run dev
```

---

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
```

Create a `.env` file in the `backend/` folder:

```env
GMAIL_USER=your_gmail@gmail.com
GMAIL_PASS=your_app_password_here
```

> **Gmail App Password:** Go to Google Account → Security → 2-Step Verification → App Passwords. Generate one for "Mail".

Start the Flask server:

```bash
python app.py
```

The API runs on `http://localhost:5000`.

---

### First Run — Model Downloads

On first startup, the backend will automatically download the ML models from HuggingFace:

| Model | Size | Purpose |
|---|---|---|
| `unitary/toxic-bert` | ~440MB | Explicit toxicity, slurs, hate speech |
| `cardiffnlp/twitter-roberta-base-offensive` | ~480MB | Social media bullying |
| `cross-encoder/nli-MiniLM2-L6-H768` | ~80MB | Zero-shot: sarcasm & exclusion |

Models are cached locally after the first download.

---

## 🌐 API Endpoints

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/analyze` | Run full ensemble analysis on text |
| `POST` | `/api/ocr` | Extract text from uploaded image |
| `GET`  | `/api/history?email=` | Fetch user's analysis history |
| `POST` | `/api/send-safety-email` | Send safety alert email |
| `GET`  | `/api/health` | Server health check |

---

## 🔑 Environment Variables

### Frontend — `frontend/.env`

| Variable | Description |
|---|---|
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth 2.0 Client ID |
| `VITE_API_URL` | Backend URL (default: `http://localhost:5000`) |

### Backend — `backend/.env` *(recommended)*

| Variable | Description |
|---|---|
| `GMAIL_USER` | Gmail address for sending safety emails |
| `GMAIL_PASS` | Gmail App Password (not your login password) |

---

## 🛠️ Tech Stack

**Frontend**
- React 18 + Vite
- React Router v6
- TailwindCSS
- @react-oauth/google
- react-hot-toast

**Backend**
- Flask + Flask-CORS
- HuggingFace Transformers (PyTorch)
- MongoDB + PyMongo
- Pytesseract + Pillow (OCR)
- NLTK

---

## 📦 Backend Dependencies

```txt
flask
flask-cors
transformers
torch
pymongo
pytesseract
Pillow
nltk
sentence-transformers
python-dotenv
```

Install all:
```bash
pip install flask flask-cors transformers torch pymongo pytesseract Pillow nltk sentence-transformers python-dotenv
```

---

## 🔒 Security Notes

- Never commit `.env` files — both are listed in `.gitignore`
- Rotate your Google OAuth client ID if it was ever pushed to a public repo
- Use Gmail App Passwords, never your actual Gmail login password
- MongoDB runs locally with no auth by default — add auth before any production deployment

---

## 📄 License

This project was built for educational purposes as part of a student project on AI safety and cyberbullying prevention.

---

*ShieldAI — Detect. Protect. Act.*
