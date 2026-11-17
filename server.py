from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import csv
import uuid
import random
import json
import smtplib
from pathlib import Path
from email.mime.text import MIMEText

app = Flask(__name__)

# -----------------------------
# CORS
# -----------------------------
CORS(app)

# -----------------------------
# PostgreSQL Configuration
# -----------------------------
from sqlalchemy.engine import URL
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

app.config['SQLALCHEMY_DATABASE_URI'] = URL.create(
    "postgresql+psycopg",   # matches the psycopg (v3) driver in your traceback
    username="postgres",
    password="admin@123",   # raw password, no encoding needed
    host="localhost",
    port=5432,
    database="interner",
)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# -----------------------------
# User Model
# -----------------------------
class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    firstName = db.Column(db.String(100), nullable=False)
    lastName = db.Column(db.String(100), nullable=False)

    name = db.Column(db.String(200), nullable=False)

    email = db.Column(db.String(200), unique=True, nullable=False)

    password = db.Column(db.String(300), nullable=False)

    skills = db.Column(db.Text, default='[]')

    def to_dict(self):
        return {
            "id": self.id,
            "firstName": self.firstName,
            "lastName": self.lastName,
            "name": self.name,
            "email": self.email,
            "skills": json.loads(self.skills)
        }

# -----------------------------
# Create Tables
# -----------------------------
with app.app_context():
    db.create_all()

# =========================================================
# INTERNSHIP DATASET
# =========================================================
@app.route('/internships', methods=['GET'])
def get_internships():
    dataset_path = Path(__file__).parent / 'data' / 'internship_recommendation_dataset_750.csv'

    try:
        with dataset_path.open(encoding='utf-8-sig', newline='') as dataset_file:
            rows = csv.DictReader(dataset_file)
            internships = [{
                "id": row["internship_id"],
                "role": row["title"],
                "company": row["company"],
                "location": row["location"],
                "skills": [skill.strip() for skill in row["required_skills"].split(';') if skill.strip()],
                "qualification": row["qualification"],
                "experienceYears": row["experience_years"],
                "category": row["category"],
                "stipend": row["stipend"],
                "duration": row["duration"],
                "description": row["description"],
                "link": row["application_url"],
            } for row in rows]
    except (OSError, KeyError, ValueError):
        app.logger.exception("Unable to load internship dataset")
        return jsonify({"error": "Internship listings are temporarily unavailable"}), 500

    return jsonify({"internships": internships, "total": len(internships)})

# =========================================================
# SIGNUP
# =========================================================
@app.route('/signup', methods=['POST'])
def signup():

    try:
        data = request.get_json()

        first_name = data.get('firstName')
        last_name = data.get('lastName')
        email = data.get('email')
        password = data.get('password')

        if not all([first_name, last_name, email, password]):
            return jsonify({
                "error": "All fields are required"
            }), 400

        existing_user = User.query.filter_by(email=email).first()

        if existing_user:
            return jsonify({
                "error": "User already exists"
            }), 409

        hashed_password = generate_password_hash(password)

        new_user = User(
            firstName=first_name,
            lastName=last_name,
            name=f"{first_name} {last_name}",
            email=email,
            password=hashed_password,
            skills='[]'
        )

        db.session.add(new_user)
        db.session.commit()

        return jsonify({
            "message": "Signup successful",
            "user": new_user.to_dict()
        }), 201

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500

# =========================================================
# LOGIN
# =========================================================
@app.route('/login', methods=['POST'])
def login():

    try:
        data = request.get_json()

        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return jsonify({
                "error": "Email and password required"
            }), 400

        user = User.query.filter_by(email=email).first()

        if not user:
            return jsonify({
                "error": "User not found"
            }), 404

        if not check_password_hash(user.password, password):
            return jsonify({
                "error": "Invalid password"
            }), 401

        return jsonify({
            "message": "Login successful",
            "user": user.to_dict()
        }), 200

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500

# =========================================================
# SEND OTP
# =========================================================
# =========================================================
# OTP STORAGE
# =========================================================
otp_storage = {}

# =========================================================
# GMAIL CONFIG
# =========================================================
EMAIL_ADDRESS = "exeeimbtivl@gmail.com"
EMAIL_PASSWORD = "fbee cxfd qtjb ubwn"
# =========================================================
# SEND OTP EMAIL
# =========================================================
def send_otp_email(receiver_email, otp):

    subject = "Password Reset OTP"

    body = f"""
Your OTP for password reset is:

{otp}

This OTP is valid for one use only.
"""

    msg = MIMEText(body)

    msg["Subject"] = subject
    msg["From"] = EMAIL_ADDRESS
    msg["To"] = receiver_email

    with smtplib.SMTP("smtp.gmail.com", 587) as server:
        server.starttls()
        server.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
        server.send_message(msg)

# =========================================================
# SEND OTP
# =========================================================
@app.route('/send-otp', methods=['POST'])
def send_otp():

    try:

        data = request.get_json()

        email = data.get('email')

        if not email:
            return jsonify({
                "error": "Email is required"
            }), 400

        # Check if user exists
        user = User.query.filter_by(email=email).first()

        if not user:
            return jsonify({
                "error": "User not found"
            }), 404

        # Generate OTP
        otp = str(random.randint(100000, 999999))

        # Save OTP
        otp_storage[email] = otp

        # Send Email
        send_otp_email(email, otp)

        return jsonify({
            "message": "OTP sent successfully"
        }), 200

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500

# =========================================================
# VERIFY OTP
# =========================================================
@app.route('/verify-otp', methods=['POST'])
def verify_otp():

    try:

        data = request.get_json()

        email = data.get('email')
        otp = data.get('otp')

        if not email or not otp:
            return jsonify({
                "error": "Email and OTP required"
            }), 400

        saved_otp = otp_storage.get(email)

        if not saved_otp:
            return jsonify({
                "error": "OTP expired or not found"
            }), 404

        if saved_otp != otp:
            return jsonify({
                "error": "Invalid OTP"
            }), 401

        return jsonify({
            "message": "OTP verified successfully"
        }), 200

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500

# =========================================================
# RESET PASSWORD
# =========================================================
@app.route('/reset-password', methods=['POST'])
def reset_password():

    try:

        data = request.get_json()

        email = data.get('email')
        new_password = data.get('password')

        if not email or not new_password:
            return jsonify({
                "error": "Email and password required"
            }), 400

        # Find user
        user = User.query.filter_by(email=email).first()

        if not user:
            return jsonify({
                "error": "User not found"
            }), 404

        # Update password
        user.password = generate_password_hash(new_password)

        db.session.commit()

        # Remove OTP after reset
        if email in otp_storage:
            del otp_storage[email]

        return jsonify({
            "message": "Password reset successful"
        }), 200

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500

# =========================================================
# UPDATE PROFILE
# =========================================================
@app.route('/update-profile', methods=['POST'])
def update_profile():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "A valid JSON request is required"}), 400

    user_id = data.get('id')
    name = data.get('name')
    email = data.get('email')
    skills = data.get('skills')

    if not all(isinstance(value, str) and value.strip() for value in (user_id, name, email)):
        return jsonify({"error": "User ID, name, and email are required"}), 400
    if not isinstance(skills, list) or any(not isinstance(skill, str) for skill in skills):
        return jsonify({"error": "Skills must be a list of strings"}), 400

    name_parts = name.strip().split(maxsplit=1)
    first_name = name_parts[0]
    last_name = name_parts[1] if len(name_parts) > 1 else ''
    email = email.strip()
    if len(first_name) > 100 or len(last_name) > 100 or len(email) > 200:
        return jsonify({"error": "Name or email is too long"}), 400

    try:
        user = User.query.filter_by(id=user_id).first()
        if not user:
            return jsonify({"error": "User not found"}), 404

        email_owner = User.query.filter_by(email=email).first()
        if email_owner and email_owner.id != user.id:
            return jsonify({"error": "Email address is already in use"}), 409

        user.firstName = first_name
        user.lastName = last_name
        user.name = f"{first_name} {last_name}".strip()
        user.email = email
        user.skills = json.dumps([skill.strip() for skill in skills if skill.strip()])
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Email address is already in use"}), 409
    except SQLAlchemyError:
        db.session.rollback()
        app.logger.exception("Unable to update user profile")
        return jsonify({"error": "Unable to update profile"}), 500

    return jsonify({"message": "Profile updated successfully", "user": user.to_dict()}), 200

# =========================================================
# START SERVER
# =========================================================
if __name__ == '__main__':

    print("===================================")
    print("Flask Server Running")
    print("http://localhost:5000")
    print("===================================")

    app.run(debug=True, host='0.0.0.0', port=5000)