# CyberShield — AI Cyberbullying Detection Platform

CyberShield is a full-stack web application that detects cyberbullying and toxic language using a multi-model AI ensemble. Paste a message, upload a screenshot, pick a platform, and get a real-time verdict with a breakdown of exactly why the content was flagged.

Built as a personal project to explore how transformer models perform on real-world toxic content — and to make something actually useful out of it.

---

## What it does

- Analyzes text for cyberbullying, harassment, and toxic language
- Runs **three transformer models in parallel** and combines their scores with a custom rule-based engine
- Supports **OCR** — upload a screenshot and it'll extract the text for you
- Platform-aware analysis (Instagram, Twitter/X, YouTube, WhatsApp, etc.)
- Sends a **safety warning email** to the user via Resend if harmful content is detected
- Stores analysis history per user (tied to Google login)
- Admin panel to manage the keyword pattern database (CRUD)
- User suggestion system so anyone can flag missing patterns

---

## Tech Stack

**Frontend**
- React + Vite
- Tailwind CSS
- React Router v6
- Google OAuth (`@react-oauth/google`)

**Backend**
- Python / Flask
- Hugging Face Transformers (3 models — see below)
- NLTK (preprocessing, lemmatization)
- PyTesseract (OCR)
- MongoDB (via PyMongo)
- Resend (transactional email)

---

## The AI Engine

The backend runs four detection layers and combines them into a single final score:

| Layer | Model / Method | Weight |
|---|---|---|
| Rule-based | Custom keyword DB + sentiment indicators | ~30% |
| toxic-bert | `unitary/toxic-bert` | 30% |
| twitter-roberta | `cardiffnlp/twitter-roberta-base-offensive` | 30% |
| Zero-shot | `cross-encoder/nli-MiniLM2-L6-H768` | 40% |

The zero-shot model classifies against labels like `cyberbullying`, `harassment`, `social exclusion`, `mocking someone`, and `safe conversation` — which means it can catch things the other models miss without needing explicit training on those labels.

Final score thresholds:
- `< 0.3` → **Safe**
- `0.3 – 0.6` → **Suspicious**
- `> 0.6` → **Cyberbullying / High Severity**

---

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.10+
- MongoDB Atlas account (or local MongoDB)
- Tesseract OCR installed on your machine
- A Resend account (for emails)
- Google OAuth Client ID

---

### 1. Clone the repo

```bash
git clone https://github.com/your-username/cybershield.git
cd cybershield
```

### 2. Frontend setup

```bash
cd frontend
npm install
```

Create a `.env` file inside `frontend/`:

```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

Start the dev server:

```bash
npm run dev
```

### 3. Backend setup

```bash
cd ../backend
pip install -r requirements.txt
```

Create a `.env` file inside `backend/`:

```env
MONGO_URI=your_mongodb_connection_string
RESEND_API_KEY=your_resend_api_key
```

On Windows, make sure Tesseract is installed at `C:\Program Files\Tesseract-OCR\tesseract.exe` (the default path). On Linux/macOS, just install it via your package manager and it'll be picked up automatically.

Start the Flask server:

```bash
python app.py
```

The backend runs on port `7860` by default.

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Health check |
| POST | `/api/analyze` | Analyze text (main endpoint) |
| POST | `/api/analyze/social-media` | Platform-specific analysis |
| POST | `/api/ocr` | Extract text from image |
| POST | `/api/send-safety-email` | Send warning email |
| GET | `/api/history?email=` | Get user's analysis history |
| DELETE | `/api/history/clear` | Clear user's history |
| POST | `/api/suggestions` | Submit a pattern suggestion |
| GET | `/api/admin/suggestions` | View all suggestions (admin) |
| GET | `/api/admin/patterns` | Get all keyword patterns |
| POST | `/api/admin/patterns` | Add new patterns |
| PUT | `/api/admin/patterns/:id` | Update a pattern |
| DELETE | `/api/admin/patterns/:id` | Delete a pattern |

---

## Project Structure

```
cybershield/
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Landing.jsx
│   │   │   ├── Home.jsx          # Main analysis page
│   │   │   ├── Resources.jsx
│   │   │   ├── Laws.jsx
│   │   │   ├── Videos.jsx
│   │   │   └── Admin.jsx
│   │   ├── components/
│   │   ├── context/
│   │   ├── styles/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── .env                      # VITE_GOOGLE_CLIENT_ID (not committed)
│   ├── package.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── vite.config.js
└── backend/
    ├── app.py
    └── .env                      # MONGO_URI, RESEND_API_KEY (not committed)
```

---

## Environment Variables

Never commit your `.env` files. Here's a summary of what you need:

**`frontend/.env`**
```
VITE_GOOGLE_CLIENT_ID=
```

**`backend/.env`**
```
MONGO_URI=
RESEND_API_KEY=
```

Both files are already in `.gitignore` (or should be — double check before pushing).

---

## Known Limitations

- The three transformer models are loaded at startup, so the backend takes ~30–60 seconds to boot cold depending on your machine
- OCR accuracy depends heavily on image quality — blurry screenshots will give noisy results
- The zero-shot model can occasionally be over-sensitive with very short inputs (1–3 words)
- Email sending requires a verified sender domain on Resend in production (the `onboarding@resend.dev` address only works in sandbox mode)



---

## License

MIT — do whatever you want with it, just don't use it to build something that causes the harm it's designed to detect.
