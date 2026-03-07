from flask import Flask, request, jsonify
from transformers import pipeline
from flask_cors import CORS
import re
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.stem import WordNetLemmatizer
from pymongo import MongoClient
from datetime import datetime, timezone
from PIL import Image
import pytesseract
import io
import smtplib
from email.mime.text import MIMEText

from dotenv import load_dotenv
import os

load_dotenv()

GMAIL_USER = os.getenv("GMAIL_USER")
GMAIL_PASS = os.getenv("GMAIL_PASS")

# ─── Tesseract path (Windows) ────────────────────────────────────────────────
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

# ─── MongoDB ─────────────────────────────────────────────────────────────────
client = MongoClient("mongodb://localhost:27017/")
db = client["shieldai"]
analysis_collection = db["analysis_history"]
patterns_collection = db["patterns"]

MEMORY_CACHE = []

def load_patterns_from_db():
    global MEMORY_CACHE
    MEMORY_CACHE = list(patterns_collection.find())
    print(f"✅ Loaded {len(MEMORY_CACHE)} patterns into memory")

load_patterns_from_db()

app = Flask(__name__)
CORS(app)

# ─── NLTK setup ──────────────────────────────────────────────────────────────
for resource, path in [('punkt',     'tokenizers/punkt'),
                       ('punkt_tab', 'tokenizers/punkt_tab'),
                       ('stopwords', 'corpora/stopwords'),
                       ('wordnet',   'corpora/wordnet')]:
    try:
        nltk.data.find(path)
    except LookupError:
        nltk.download(resource)

lemmatizer = WordNetLemmatizer()
stop_words = set(stopwords.words('english'))

# ─── Load models once at startup ─────────────────────────────────────────────
print("⏳ Loading ML models...")

# Model 1: Explicit toxicity (slurs, threats, hate speech)
toxic_bert = pipeline(
    "text-classification",
    model="unitary/toxic-bert",
    device=-1
)

# Model 2: Subtle social media bullying (exclusion, mockery, offensive language)
twitter_roberta = pipeline(
    "text-classification",
    model="cardiffnlp/twitter-roberta-base-offensive",
    device=-1
)

# ── ADDED: Model 3 — Zero-shot for sarcasm, indirect bullying, exclusion ─────
# cross-encoder/nli-MiniLM2-L6-H768 is tiny (~80MB) and fast on CPU
# It understands *meaning* rather than pattern-matching, catching what
# toxic-bert and roberta both miss (sarcasm, "hoping you wouldn't show up" etc.)
zero_shot = pipeline(
    "zero-shot-classification",
    model="cross-encoder/nli-MiniLM2-L6-H768",
    device=-1
)

print("✅ All 3 models loaded")

# ─── Model prediction helpers ────────────────────────────────────────────────
def truncate(text: str) -> str:
    """Truncate to ~512 tokens by word count to avoid tokenizer overflow."""
    words = text.split()
    return " ".join(words[:400]) if len(words) > 400 else text


def predict_toxic_bert(text: str) -> float:
    try:
        result = toxic_bert(truncate(text))
        if isinstance(result, list) and len(result) > 0:
            item = result[0]
            if isinstance(item, list):
                item = item[0]
            label = item.get('label', '').lower()
            score = item.get('score', 0.0)
            return score if label in ['toxic', 'severe_toxic'] else 1 - score
        return 0.0
    except Exception as e:
        print(f"toxic-bert ERROR: {e}")
        return 0.0


def predict_twitter_roberta(text: str) -> float:
    try:
        result = twitter_roberta(truncate(text))
        if isinstance(result, list) and len(result) > 0:
            item = result[0]
            if isinstance(item, list):
                item = item[0]
            label = item.get('label', '').lower()
            score = item.get('score', 0.0)
            return score if label == 'offensive' else 1 - score
        return 0.0
    except Exception as e:
        print(f"twitter-roberta ERROR: {e}")
        return 0.0


# ── ADDED: Zero-shot prediction function ─────────────────────────────────────
def predict_zero_shot(text: str) -> float:
    """
    Catches sarcasm, exclusion, mockery using semantic understanding.
    Asks: does this text MEAN cyberbullying/exclusion/harassment?
    Works even with no slurs, no keywords, no explicit toxicity.
    """
    try:
        candidate_labels = [
            "cyberbullying",
            "social exclusion",
            "mocking someone",
            "harassment",
            "safe conversation"
        ]
        result = zero_shot(truncate(text), candidate_labels)

        # Sum scores for all harmful labels
        harmful_labels = {"cyberbullying", "social exclusion",
                          "mocking someone", "harassment"}
        harmful_score = sum(
            score for label, score in zip(result['labels'], result['scores'])
            if label in harmful_labels
        )
        safe_score = next(
            (score for label, score in zip(result['labels'], result['scores'])
             if label == "safe conversation"), 0
        )

        # Normalize harmful vs safe
        return min(harmful_score / (harmful_score + safe_score + 1e-9), 1.0)
    except Exception as e:
        print(f"zero-shot ERROR: {e}")
        return 0.0


# ─── Text processing ─────────────────────────────────────────────────────────
def preprocess_text(text):
    text = text.lower()
    text = re.sub(r'http\S+', '', text)
    text = re.sub(r'@\w+', '', text)
    text = re.sub(r'#(\w+)', r'\1', text)
    text = re.sub(r'[^\w\s!?.,]', '', text)
    tokens = word_tokenize(text)
    processed = [lemmatizer.lemmatize(t) for t in tokens
                 if t not in stop_words and len(t) > 2]
    return " ".join(processed)


def detect_social_media_patterns(text, selected_platform):
    text_lower = text.lower()
    patterns_found = {}
    total_severity = 0
    for doc in MEMORY_CACHE:
        doc_platform = doc.get("platform", "general")
        if selected_platform != "general" and doc_platform not in ["general", selected_platform]:
            continue
        word = doc.get("word")
        if not word:
            continue
        category = doc.get("category", "unknown")
        severity = doc.get("severity_score", 1)
        if re.search(rf'\b{re.escape(word)}\b', text_lower):
            patterns_found.setdefault(category, []).append(word)
            total_severity += severity
    return patterns_found, total_severity


def analyze_sentiment_indicators(text):
    text_lower = text.lower()
    return {
        "excessive_caps":     sum(1 for c in text if c.isupper()) / len(text) if text else 0,
        "exclamation_density": text.count('!') / len(text.split()) if text.split() else 0,
        "threatening_words":  len([w for w in ['kill', 'die', 'hurt'] if w in text_lower])
    }


def calculate_cyberbullying_probability(text, patterns_found, sentiment, total_severity):
    total_keywords = sum(len(v) for v in patterns_found.values())
    keyword_density = total_keywords / len(text.split()) if text.split() else 0
    severity_boost = total_severity * 0.05
    base_prob = min(keyword_density * 8 + severity_boost, 1.0)
    sentiment_boost = (
        sentiment['excessive_caps'] * 3 +
        sentiment['exclamation_density'] * 2 +
        sentiment['threatening_words'] * 0.3
    )
    return min(base_prob + sentiment_boost, 1.0)


# ─── Main analysis engine ─────────────────────────────────────────────────────
def run_full_analysis(text, platform="general"):
    processed_text   = preprocess_text(text)
    patterns_found, total_severity = detect_social_media_patterns(text, platform)
    sentiment_indicators = analyze_sentiment_indicators(text)
    rule_prob = calculate_cyberbullying_probability(
        text, patterns_found, sentiment_indicators, total_severity
    )

    # ── Run all 3 ML models ───────────────────────────────────────────────────
    toxic_score    = predict_toxic_bert(text)       # explicit toxicity
    roberta_score  = predict_twitter_roberta(text)  # subtle social media bullying
    zeroshot_score = predict_zero_shot(text)        # ← ADDED: sarcasm + indirect bullying

    print(f"rule={rule_prob:.3f} | toxic={toxic_score:.3f} | roberta={roberta_score:.3f} | zeroshot={zeroshot_score:.3f}")

    # ── Combine scores ────────────────────────────────────────────────────────
    # Zero-shot gets highest weight (0.4) — best at understanding meaning
    # Roberta gets 0.3  — best at social media language patterns
    # Toxic-bert gets 0.3 — best at explicit slurs/threats
    ml_combined = (toxic_score * 0.3) + (roberta_score * 0.3) + (zeroshot_score * 0.4)  # ← UPDATED weights

    # Confidence boost when rule-based AND ML both agree
    if rule_prob > 0.4 and ml_combined > 0.4:
        final_score = min((rule_prob + ml_combined) / 2 + 0.1, 1.0)
    else:
        final_score = (rule_prob + ml_combined) / 2

    # ── Category + Severity ───────────────────────────────────────────────────
    if final_score < 0.3:
        category = "Safe"
        severity = "Low"
    elif final_score < 0.6:
        category = "Suspicious"
        severity = "Medium"
    else:
        category = "Cyberbullying"
        severity = "High"

    # ── Per-model labels ──────────────────────────────────────────────────────
    def score_to_label(score):
        if score < 0.3:   return "Safe",         "Low"
        elif score < 0.6: return "Suspicious",   "Medium"
        else:             return "Cyberbullying", "High"

    tb_cat,  tb_sev  = score_to_label(toxic_score)
    rob_cat, rob_sev = score_to_label(roberta_score)
    rb_cat,  rb_sev  = score_to_label(rule_prob)
    zs_cat,  zs_sev  = score_to_label(zeroshot_score)   # ← ADDED

    models_output = {
        "rule_based": {
            "probability": round(rule_prob, 4),
            "category":    rb_cat,
            "severity":    rb_sev
        },
        "toxic_bert": {
            "probability": round(toxic_score, 4),
            "category":    tb_cat,
            "severity":    tb_sev
        },
        "twitter_roberta": {
            "probability": round(roberta_score, 4),
            "category":    rob_cat,
            "severity":    rob_sev
        },
        # ── ADDED: zero_shot card shown on frontend ───────────────────────────
        "zero_shot": {
            "probability": round(zeroshot_score, 4),
            "category":    zs_cat,
            "severity":    zs_sev
        }
    }

    # ── Flagged keywords ──────────────────────────────────────────────────────
    flagged_keywords = []
    bullying_types = set()
    for cat, words in patterns_found.items():
        bullying_types.add(cat)
        for word in set(words):
            flagged_keywords.append({"word": word, "category": cat})

    return {
        "final_score":     round(final_score, 4),
        "category":        category,
        "severity":        severity,
        "models":          models_output,
        "flagged_keywords": flagged_keywords,
        "bullying_types":  list(bullying_types)
    }


# ─── Routes ───────────────────────────────────────────────────────────────────
@app.route('/api/analyze', methods=['POST'])
def analyze_text():
    try:
        data       = request.get_json()
        text       = data.get('text', '')
        platform   = data.get('platform', 'general')
        user_email = data.get('user_email', None)   # ← ADDED: receive email from frontend

        if not text:
            return jsonify({'error': 'No text provided'}), 400

        result = run_full_analysis(text, platform)

        analysis_collection.insert_one({
            "text":             text,
            "platform":         platform,
            "user_email":       user_email,           # ← ADDED: save who ran this
            "final_score":      result["final_score"],
            "category":         result["category"],   # ← ADDED: save for history display
            "severity":         result["severity"],   # ← ADDED: save for history display
            "models":           result["models"],
            "flagged_keywords": result["flagged_keywords"],
            "bullying_types":   result["bullying_types"],
            "timestamp":        datetime.now(timezone.utc)
        })

        return jsonify(result)
    except Exception as e:
        print(f"ERROR: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/analyze/social-media', methods=['POST'])
def analyze_social_media_specific():
    try:
        data     = request.get_json()
        text     = data.get('text', '')
        platform = data.get('platform', 'general')
        if not text:
            return jsonify({'error': 'No text provided'}), 400
        result = run_full_analysis(text, platform)
        rb = result["models"]["rule_based"]
        result['social_media_insights'] = {
            "platform":       platform,
            "recommendation": generate_social_media_recommendation(rb, platform)
        }
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


def generate_social_media_recommendation(result, platform):
    p = result.get("probability", 0)
    if p < 0.3:   return "Content appears safe for social media sharing."
    elif p < 0.6: return f"Consider reviewing this {platform} content."
    else:         return f"Immediate action recommended on {platform}."


@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        "status":  "healthy",
        "message": "Multi-Model Cyberbullying API Running",
        "models":  ["rule_based", "toxic_bert", "twitter_roberta", "zero_shot"],
        "version": "5.0-triple-model"
    })


# ─── OCR endpoint ─────────────────────────────────────────────────────────────
@app.route('/api/ocr', methods=['POST'])
def extract_text_from_image():
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image uploaded'}), 400
        file = request.files['image']
        if file.filename == '':
            return jsonify({'error': 'Empty filename'}), 400

        image_bytes = file.read()
        image = Image.open(io.BytesIO(image_bytes))
        if image.mode not in ('RGB', 'L'):
            image = image.convert('RGB')

        extracted_text = pytesseract.image_to_string(image)
        cleaned = re.sub(r'\n{3,}', '\n\n', extracted_text).strip()

        print(f"✅ OCR extracted {len(cleaned)} characters")
        return jsonify({'text': cleaned})
    except Exception as e:
        print(f"❌ OCR ERROR: {e}")
        return jsonify({'error': str(e)}), 500


# ─── Email endpoint ───────────────────────────────────────────────────────────
   # move to .env in production

@app.route('/api/send-safety-email', methods=['POST'])
def send_safety_email():
    try:
        data  = request.json
        email = data.get("email")
        name  = data.get("name")
        text  = data.get("text")

        print(f"📧 Sending safety email to: {email}")
        if not email:
            return jsonify({"error": "No email provided"}), 400

        message = f"""Hi {name},

Our AI detected potentially harmful language in a message analyzed on ShieldAI:

"{text}"

Please consider rewriting your message respectfully.

— ShieldAI Safety System"""

        msg = MIMEText(message)
        msg["Subject"] = "ShieldAI Safety Warning"
        msg["From"]    = GMAIL_USER
        msg["To"]      = email

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(GMAIL_USER, GMAIL_PASS)
            server.sendmail(GMAIL_USER, [email], msg.as_string())

        print(f"✅ Email sent to {email}")
        return jsonify({"status": "sent"})
    except Exception as e:
        print(f"❌ EMAIL ERROR: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/history', methods=['GET'])
def get_history():
    try:
        email = request.args.get('email')
        if not email:
            return jsonify({'error': 'No email provided'}), 400

        # Fetch last 20 analyses for this user, newest first
        records = list(
            analysis_collection
            .find({"user_email": email}, {"_id": 0})   # exclude MongoDB _id
            .sort("timestamp", -1)
            .limit(20)
        )

        # Convert datetime to ISO string for JSON serialization
        for r in records:
            if "timestamp" in r and hasattr(r["timestamp"], "isoformat"):
                r["timestamp"] = r["timestamp"].isoformat()

        return jsonify({"history": records})
    except Exception as e:
        print(f"HISTORY ERROR: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/debug-analyze', methods=['POST'])
def debug_analyze():
    data  = request.get_json()
    text  = data.get('text', '')
    _, _  = detect_social_media_patterns(text, 'general')
    return jsonify({
        "text":            text,
        "toxic_bert":      round(predict_toxic_bert(text), 4),
        "twitter_roberta": round(predict_twitter_roberta(text), 4),
        "zero_shot":       round(predict_zero_shot(text), 4),
    })


# 🚨 ALWAYS LAST
if __name__ == "__main__":
    app.run(debug=True, port=5000)