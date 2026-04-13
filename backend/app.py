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
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv
import os

load_dotenv()

GMAIL_USER = os.getenv("GMAIL_USER", "").strip().strip('"').strip("'")
GMAIL_PASS = os.getenv("GMAIL_PASS", "").strip().strip('"').strip("'")

# ─── Tesseract path (Windows) ────────────────────────────────────────────────
if os.name == "nt":
    pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

# ─── MongoDB ─────────────────────────────────────────────────────────────────
MONGO_URI = os.getenv("MONGO_URI")
print("DEBUG URI:", MONGO_URI)
client = MongoClient(MONGO_URI)

# debug code 

try:
    client.admin.command('ping')
    print("✅ MongoDB Connected Successfully")
except Exception as e:
    print("❌ Connection Failed:", e)
    exit()


db = client["shieldai"]
analysis_collection = db["analysis_history"]
patterns_collection = db["patterns"]
suggestions_collection = db["suggestions"]

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

toxic_bert = pipeline(
    "text-classification",
    model="unitary/toxic-bert",
    device=-1
)

twitter_roberta = pipeline(
    "text-classification",
    model="cardiffnlp/twitter-roberta-base-offensive",
    device=-1
)

zero_shot = pipeline(
    "zero-shot-classification",
    model="cross-encoder/nli-MiniLM2-L6-H768",
    device=-1
)

print("✅ All 3 models loaded")

# ─── Model prediction helpers ─────────────────────────────────────────────────
def truncate(text: str) -> str:
    words = text.split()
    return " ".join(words[:400]) if len(words) > 400 else text


def predict_toxic_bert(text: str) -> float:
    try:
        result = toxic_bert(truncate(text))
        if isinstance(result, list) and len(result) > 0:
            item = result[0]
            if isinstance(item, list): item = item[0]
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
            if isinstance(item, list): item = item[0]
            label = item.get('label', '').lower()
            score = item.get('score', 0.0)
            return score if label == 'offensive' else 1 - score
        return 0.0
    except Exception as e:
        print(f"twitter-roberta ERROR: {e}")
        return 0.0


def predict_zero_shot(text: str) -> float:
    try:
        candidate_labels = [
            "cyberbullying", "social exclusion",
            "mocking someone", "harassment", "safe conversation"
        ]
        result = zero_shot(truncate(text), candidate_labels)
        harmful_labels = {"cyberbullying", "social exclusion", "mocking someone", "harassment"}
        harmful_score = sum(
            score for label, score in zip(result['labels'], result['scores'])
            if label in harmful_labels
        )
        safe_score = next(
            (score for label, score in zip(result['labels'], result['scores'])
             if label == "safe conversation"), 0
        )
        return min(harmful_score / (harmful_score + safe_score + 1e-9), 1.0)
    except Exception as e:
        print(f"zero-shot ERROR: {e}")
        return 0.0


# ─── Text processing ──────────────────────────────────────────────────────────
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
        if not word: continue
        category = doc.get("category", "unknown")
        severity = doc.get("severity_score", 1)
        if re.search(rf'\b{re.escape(word)}\b', text_lower):
            patterns_found.setdefault(category, []).append(word)
            total_severity += severity
    return patterns_found, total_severity


def analyze_sentiment_indicators(text):
    text_lower = text.lower()
    return {
        "excessive_caps":      sum(1 for c in text if c.isupper()) / len(text) if text else 0,
        "exclamation_density": text.count('!') / len(text.split()) if text.split() else 0,
        "threatening_words":   len([w for w in ['kill', 'die', 'hurt'] if w in text_lower])
    }


def calculate_cyberbullying_probability(text, patterns_found, sentiment, total_severity):
    total_keywords = sum(len(v) for v in patterns_found.values())
    keyword_density = total_keywords / len(text.split()) if text.split() else 0
    severity_boost  = total_severity * 0.05
    base_prob       = min(keyword_density * 8 + severity_boost, 1.0)
    sentiment_boost = (
        sentiment['excessive_caps'] * 3 +
        sentiment['exclamation_density'] * 2 +
        sentiment['threatening_words'] * 0.3
    )
    return min(base_prob + sentiment_boost, 1.0)


# ─── Main analysis engine ──────────────────────────────────────────────────────
def run_full_analysis(text, platform="general"):
    processed_text   = preprocess_text(text)
    patterns_found, total_severity = detect_social_media_patterns(text, platform)
    sentiment_indicators = analyze_sentiment_indicators(text)
    rule_prob = calculate_cyberbullying_probability(
        text, patterns_found, sentiment_indicators, total_severity
    )

    toxic_score    = predict_toxic_bert(text)
    roberta_score  = predict_twitter_roberta(text)
    zeroshot_score = predict_zero_shot(text)

    print(f"rule={rule_prob:.3f} | toxic={toxic_score:.3f} | roberta={roberta_score:.3f} | zeroshot={zeroshot_score:.3f}")

    ml_combined = (toxic_score * 0.3) + (roberta_score * 0.3) + (zeroshot_score * 0.4)

    if rule_prob > 0.4 and ml_combined > 0.4:
        final_score = min((rule_prob + ml_combined) / 2 + 0.1, 1.0)
    else:
        final_score = (rule_prob + ml_combined) / 2

    if final_score < 0.3:
        category = "Safe";    severity = "Low"
    elif final_score < 0.6:
        category = "Suspicious"; severity = "Medium"
    else:
        category = "Cyberbullying"; severity = "High"

    def score_to_label(score):
        if score < 0.3:   return "Safe",         "Low"
        elif score < 0.6: return "Suspicious",   "Medium"
        else:             return "Cyberbullying", "High"

    tb_cat,  tb_sev  = score_to_label(toxic_score)
    rob_cat, rob_sev = score_to_label(roberta_score)
    rb_cat,  rb_sev  = score_to_label(rule_prob)
    zs_cat,  zs_sev  = score_to_label(zeroshot_score)

    models_output = {
        "rule_based":      {"probability": round(rule_prob, 4),        "category": rb_cat,  "severity": rb_sev},
        "toxic_bert":      {"probability": round(toxic_score, 4),      "category": tb_cat,  "severity": tb_sev},
        "twitter_roberta": {"probability": round(roberta_score, 4),    "category": rob_cat, "severity": rob_sev},
        "zero_shot":       {"probability": round(zeroshot_score, 4),   "category": zs_cat,  "severity": zs_sev},
    }

    flagged_keywords = []
    bullying_types   = set()
    for cat, words in patterns_found.items():
        bullying_types.add(cat)
        for word in set(words):
            flagged_keywords.append({"word": word, "category": cat})

    return {
        "final_score":      round(final_score, 4),
        "category":         category,
        "severity":         severity,
        "models":           models_output,
        "flagged_keywords": flagged_keywords,
        "bullying_types":   list(bullying_types)
    }


# ─── Routes ───────────────────────────────────────────────────────────────────
@app.route('/api/analyze', methods=['POST'])
def analyze_text():
    try:
        data       = request.get_json()
        text       = data.get('text', '')
        platform   = data.get('platform', 'general')
        user_email = data.get('user_email', None)

        if not text:
            return jsonify({'error': 'No text provided'}), 400

        result = run_full_analysis(text, platform)

        analysis_collection.insert_one({
            "text":             text,
            "platform":         platform,
            "user_email":       user_email,
            "final_score":      result["final_score"],
            "category":         result["category"],
            "severity":         result["severity"],
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


# ─── Email endpoint (FIXED) ───────────────────────────────────────────────────
# FIX 1: Validate env vars on startup and log clearly.
# FIX 2: Strip stray quotes that dotenv sometimes preserves.
# FIX 3: Try SMTP_SSL first (port 465), fall back to STARTTLS (port 587).
# FIX 4: Return descriptive error so the frontend can show it to the user.

@app.route('/api/send-safety-email', methods=['POST'])
def send_safety_email():
    # ── Validate config ───────────────────────────────────────────────────────
    if not GMAIL_USER or not GMAIL_PASS:
        print("❌ EMAIL CONFIG: GMAIL_USER or GMAIL_PASS not set in .env")
        return jsonify({"error": "Email service not configured. Check GMAIL_USER and GMAIL_PASS in .env"}), 503

    try:
        data  = request.json or {}
        email = (data.get("email") or "").strip()
        name  = (data.get("name")  or "User").strip()
        text  = (data.get("text")  or "").strip()

        if not email:
            return jsonify({"error": "No recipient email provided"}), 400

        print(f"📧 Sending safety email to: {email} from: {GMAIL_USER}")

        # ── Build MIME message ────────────────────────────────────────────────
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "CyberShield — Safety Warning"
        msg["From"]    = f"CyberShield Safety <{GMAIL_USER}>"
        msg["To"]      = email

        plain_body = f"""Hi {name},

Our AI detected potentially harmful language in a message analyzed on CyberShield:

"{text}"

Please consider rewriting your message to be more respectful.

— CyverShield Safety System
"""

        html_body = f"""
<html><body style="font-family:Arial,sans-serif;background:#0f172a;color:#e2e8f0;padding:32px;">
  <div style="max-width:560px;margin:auto;background:#1e293b;border-radius:12px;padding:32px;border:1px solid rgba(6,182,212,0.3);">
    <h2 style="color:#06b6d4;margin-top:0;">⚠ CyberShield Safety Warning</h2>
    <p>Hi <strong>{name}</strong>,</p>
    <p>We detected potentially harmful language in a message you analyzed:</p>
    <blockquote style="border-left:3px solid #ef4444;padding:12px 16px;background:rgba(239,68,68,0.08);border-radius:4px;margin:16px 0;">
      <em style="color:#fca5a5;">"{text}"</em>
    </blockquote>
    <p>Please consider reviewing your message.</p>
    <hr style="border-color:rgba(6,182,212,0.2);margin:24px 0;">
    <p style="font-size:12px;color:#64748b;">— CyberShield Safety System &nbsp;|&nbsp; Cyberbullying Detection Platform</p>
  </div>
</body></html>
"""

        msg.attach(MIMEText(plain_body, "plain"))
        msg.attach(MIMEText(html_body,  "html"))

        # ── Try SMTP_SSL (port 465) first, then STARTTLS (port 587) ──────────
        sent = False
        last_error = None

        try:
            with smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=15) as server:
                server.login(GMAIL_USER, GMAIL_PASS)
                server.sendmail(GMAIL_USER, [email], msg.as_string())
                sent = True
                print(f"✅ Email sent via SMTP_SSL to {email}")
        except Exception as ssl_err:
            last_error = ssl_err
            print(f"⚠ SMTP_SSL failed ({ssl_err}), trying STARTTLS on port 587...")

        if not sent:
            try:
                with smtplib.SMTP("smtp.gmail.com", 587, timeout=15) as server:
                    server.ehlo()
                    server.starttls()
                    server.ehlo()
                    server.login(GMAIL_USER, GMAIL_PASS)
                    server.sendmail(GMAIL_USER, [email], msg.as_string())
                    sent = True
                    print(f"✅ Email sent via STARTTLS to {email}")
            except Exception as tls_err:
                last_error = tls_err
                print(f"❌ STARTTLS also failed: {tls_err}")

        if not sent:
            raise last_error

        return jsonify({"status": "sent", "to": email})

    except smtplib.SMTPAuthenticationError:
        msg_text = (
            "Gmail authentication failed. "
            "Make sure GMAIL_PASS is a 16-character App Password "
            "(not your regular Gmail password). "
            "Enable 2FA then generate one at myaccount.google.com/apppasswords."
        )
        print(f"❌ {msg_text}")
        return jsonify({"error": msg_text}), 401

    except smtplib.SMTPRecipientsRefused:
        return jsonify({"error": f"Recipient address refused: {email}"}), 400

    except Exception as e:
        print(f"❌ EMAIL ERROR: {type(e).__name__}: {e}")
        return jsonify({"error": f"Email failed: {str(e)}"}), 500


# ─── History endpoint ─────────────────────────────────────────────────────────
@app.route('/api/history', methods=['GET'])
def get_history():
    try:
        email = request.args.get('email')
        if not email:
            return jsonify({'error': 'No email provided'}), 400

        records = list(
            analysis_collection
            .find({"user_email": email}, {"_id": 0})
            .sort("timestamp", -1)
            .limit(50)   # increased from 20 so download has more data
        )

        for r in records:
            if "timestamp" in r and hasattr(r["timestamp"], "isoformat"):
                r["timestamp"] = r["timestamp"].isoformat()

        return jsonify({"history": records})
    except Exception as e:
        print(f"HISTORY ERROR: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/history/clear', methods=['DELETE'])
def clear_history():
    try:
        data  = request.get_json() or {}
        email = (data.get('email') or '').strip()
        if not email:
            return jsonify({'error': 'No email provided'}), 400
        result = analysis_collection.delete_many({"user_email": email})
        print(f"✅ Cleared {result.deleted_count} records for {email}")
        return jsonify({'status': 'success', 'deleted': result.deleted_count})
    except Exception as e:
        print(f"CLEAR HISTORY ERROR: {e}")
        return jsonify({'error': str(e)}), 500


# ─── Suggestions endpoints ────────────────────────────────────────────────────
@app.route('/api/suggestions', methods=['POST'])
def add_suggestion():
    try:
        data  = request.get_json() or {}
        text  = (data.get('text')  or '').strip()
        email = (data.get('email') or '').strip()
        if not text:
            return jsonify({'error': 'Suggestion text cannot be empty'}), 400
        suggestions_collection.insert_one({
            "text":      text,
            "email":     email or "anonymous",
            "timestamp": datetime.now(timezone.utc),
        })
        return jsonify({'status': 'success'})
    except Exception as e:
        print(f"SUGGESTION ERROR: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/admin/suggestions', methods=['GET'])
def get_suggestions():
    try:
        docs = list(suggestions_collection.find({}, {"_id": 0}).sort("timestamp", -1))
        for d in docs:
            if "timestamp" in d and hasattr(d["timestamp"], "isoformat"):
                d["timestamp"] = d["timestamp"].isoformat()
        return jsonify({'suggestions': docs, 'count': len(docs)})
    except Exception as e:
        print(f"GET SUGGESTIONS ERROR: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/debug-analyze', methods=['POST'])
def debug_analyze():
    data = request.get_json()
    text = data.get('text', '')
    detect_social_media_patterns(text, 'general')
    return jsonify({
        "text":            text,
        "toxic_bert":      round(predict_toxic_bert(text), 4),
        "twitter_roberta": round(predict_twitter_roberta(text), 4),
        "zero_shot":       round(predict_zero_shot(text), 4),
    })


from bson import ObjectId

# ── GET all patterns ──────────────────────────────────────────────────────────
@app.route('/api/admin/patterns', methods=['GET'])
def get_patterns():
    try:
        docs = list(patterns_collection.find())
        for doc in docs:
            doc['_id'] = str(doc['_id'])
        return jsonify({'patterns': docs, 'count': len(docs)})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ── POST — insert one or many patterns ───────────────────────────────────────
@app.route('/api/admin/patterns', methods=['POST'])
def add_patterns():
    try:
        data     = request.get_json()
        patterns = data.get('patterns', [])

        if not patterns or not isinstance(patterns, list):
            return jsonify({'error': 'patterns must be a non-empty array'}), 400

        for p in patterns:
            if not p.get('word'):     return jsonify({'error': 'Missing field: word'}), 400
            if not p.get('platform'): return jsonify({'error': 'Missing field: platform'}), 400
            if not p.get('category'): return jsonify({'error': 'Missing field: category'}), 400
            p.setdefault('severity_score', 1)

        result = patterns_collection.insert_many(patterns)
        load_patterns_from_db()

        print(f"✅ Admin inserted {len(result.inserted_ids)} patterns")
        return jsonify({'status': 'success', 'inserted': len(result.inserted_ids)})

    except Exception as e:
        print(f"ADD PATTERN ERROR: {e}")
        return jsonify({'error': str(e)}), 500


# ── PUT — update a single pattern by _id ─────────────────────────────────────
@app.route('/api/admin/patterns/<pattern_id>', methods=['PUT'])
def update_pattern(pattern_id):
    try:
        data = request.get_json()
        update_fields = {}
        if 'word'           in data: update_fields['word']           = data['word']
        if 'platform'       in data: update_fields['platform']       = data['platform']
        if 'category'       in data: update_fields['category']       = data['category']
        if 'severity_score' in data: update_fields['severity_score'] = int(data['severity_score'])

        if not update_fields:
            return jsonify({'error': 'No fields to update'}), 400

        result = patterns_collection.update_one(
            {'_id': ObjectId(pattern_id)},
            {'$set': update_fields}
        )

        if result.matched_count == 0:
            return jsonify({'error': 'Pattern not found'}), 404

        load_patterns_from_db()
        return jsonify({'status': 'success', 'updated': result.modified_count})

    except Exception as e:
        print(f"UPDATE PATTERN ERROR: {e}")
        return jsonify({'error': str(e)}), 500


# ── DELETE — remove a single pattern by _id ──────────────────────────────────
@app.route('/api/admin/patterns/<pattern_id>', methods=['DELETE'])
def delete_pattern(pattern_id):
    try:
        result = patterns_collection.delete_one({'_id': ObjectId(pattern_id)})
        if result.deleted_count == 0:
            return jsonify({'error': 'Pattern not found'}), 404
        load_patterns_from_db()
        return jsonify({'status': 'success', 'deleted': result.deleted_count})
    except Exception as e:
        print(f"DELETE PATTERN ERROR: {e}")
        return jsonify({'error': str(e)}), 500


# 🚨 ALWAYS LAST
if __name__ == "__main__":
    print(f"📧 Email configured: {'YES (' + GMAIL_USER + ')' if GMAIL_USER else 'NO — set GMAIL_USER & GMAIL_PASS in .env'}")
    app.run(host="0.0.0.0", port=7860)