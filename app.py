import logging
from logging.handlers import RotatingFileHandler
import os
from flask import Flask, jsonify, request, send_file, session, redirect, url_for
from datetime import timedelta
from werkzeug.security import check_password_hash, generate_password_hash

# CORS support (optional - install flask-cors if needed)
try:
    from flask_cors import CORS
except ImportError:
    CORS = None

# Connect the database and create it if needed
from database import connect_db
from db_setup import setup_database

setup_database()

app = Flask(__name__, static_folder='.', static_url_path='')
app.secret_key = 'your-secret-key-change-in-production-12345'  # Change this in production
# Make session cookies permanent by default when requested (used by "Remember me")
app.permanent_session_lifetime = timedelta(days=30)

if CORS:
    CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
LOG_DIR = os.path.join(BASE_DIR, 'logs')
os.makedirs(LOG_DIR, exist_ok=True)
LOG_FILE = os.path.join(LOG_DIR, 'error.log')

# Create log file if it doesn't exist (properly closed)
with open(LOG_FILE, 'a', encoding='utf-8'):
    pass

# Show errors in log file and console when the flask server runs
logger = logging.getLogger('app_logger')
logger.setLevel(logging.INFO)
if not logger.handlers:
    file_handler = RotatingFileHandler(LOG_FILE, maxBytes=1024*1024, backupCount=3, encoding='utf-8')
    file_handler.setLevel(logging.INFO)
    formatter = logging.Formatter('%(asctime)s %(levelname)s %(message)s')
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)
logger.info(f"Logging initialized. Log file: {LOG_FILE}")


# ========== HELPER FUNCTIONS ==========
def is_safe_redirect(target):
    """Allow only internal redirects (starting with /)"""
    return target and target.startswith('/')


# ========== AUTH ROUTES ==========
# DATABASE MATHI PASS AND EMAIL  CHECK KARSE  AND ERRROR AND SUCESS SHOW KARSE  AND ALSO LOGIN PAGE AND PROFILE PAGE
@app.route('/login', methods=['GET'])
def login_page():
    """Serve login page (loginn.html)"""
    next_page = request.args.get('next', '/profiles')
    # user already loggin che cheak kare che 
    if session.get('logged_in'):
        # Already logged in — redirect to next page or profiles
        return redirect(next_page if is_safe_redirect(next_page) else url_for('profiles'))
    try:
        with open(os.path.join(BASE_DIR, 'loginn.html'), 'r', encoding='utf-8') as f:
            return f.read()
    except Exception as e:
        logger.error(f"Error serving loginn.html: {e}")
        return send_file(os.path.join(BASE_DIR, 'loginn.html'))

# --------------------------------------


@app.route('/login', methods=['POST'])
def login():
    """Handle login authentication. Checks both `users` (email) and `login_users` (username) tables."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "message": "No data provided"}), 400

        email_or_username = data.get('email', '').strip()
        password = data.get('password', '')
        remember = bool(data.get('remember', False))
        login_ident = email_or_username or 'UNKNOWN'

        logger.info(f"[LOGIN] Attempt: email/username='{login_ident}', password={'*' * len(password)}")

        if not email_or_username or password == '':
            logger.warning("[LOGIN FAILED] Missing credentials")
            return jsonify({"success": False, "message": "Email/username and password required"}), 400

        conn = connect_db()
        cursor = conn.cursor(dictionary=True)

        # Normalize input to lowercase for case-insensitive matching
        normalized_input = email_or_username.lower()

        # 1) Try users table by email
        cursor.execute("SELECT id, email, password FROM users WHERE LOWER(email) = %s", (normalized_input,))
        user = cursor.fetchone()
        if user:
            logger.info("[LOGIN] User found in users table")

        # 2) If not found, try login_users table by username
        if not user:
            cursor.execute("SELECT id, username AS email, password FROM login_users WHERE LOWER(username) = %s", (normalized_input,))
            user = cursor.fetchone()
            if user:
                logger.info("[LOGIN] User found in login_users table")

        # 3) Trimmed fallback for users table
        if not user:
            cursor.execute("SELECT id, email, password FROM users WHERE TRIM(LOWER(email)) = %s", (normalized_input,))
            user = cursor.fetchone()
            if user:
                logger.info("[LOGIN] User found in users table after trimmed email match")

        # 4) Trimmed fallback for login_users table
        if not user:
            cursor.execute("SELECT id, username AS email, password FROM login_users WHERE TRIM(LOWER(username)) = %s", (normalized_input,))
            user = cursor.fetchone()
            if user:
                logger.info("[LOGIN] User found in login_users table after trimmed username match")

        password_matches = False
        if user:
            stored_password = user.get('password')
            if stored_password:
                try:
                    password_matches = check_password_hash(stored_password, password)
                    logger.info(f"[LOGIN] Hash check result: {password_matches}")
                except Exception as e:
                    logger.error(f"[LOGIN] Hash check error: {e}")
                    password_matches = False

                # Fallback for plain-text passwords (legacy only)
                if not password_matches:
                    password_matches = (stored_password == password)
                    logger.info(f"[LOGIN] Fallback plain-text check result: {password_matches}")
        else:
            logger.warning("[LOGIN] User not found")

        cursor.close()
        conn.close()

        if password_matches:
            session.permanent = remember
            session['logged_in'] = True
            session['username'] = user.get('email') or email_or_username
            session['user_id'] = user.get('id')
            logger.info(f"[LOGIN SUCCESS] User '{email_or_username}' logged in successfully")
            return jsonify({"success": True, "message": "Login successful!"})

        logger.warning(f"[LOGIN FAILED] Invalid credentials for '{email_or_username}'")
        return jsonify({"success": False, "message": "Invalid email/username or password"}), 401

    except Exception as e:
        logger.error(f"Error during login: {e}")
        return jsonify({"success": False, "error": str(e)}), 500





#  this is logout code to logout the user and also show the log in page when user click the logout button in profile page
@app.route('/logout', methods=['GET', 'POST'])
def logout():
    """Handle logout"""
    username = session.get('username', 'Unknown')
    session.clear()
    logger.info(f"[LOGOUT] User '{username}' logged out")
    return redirect(url_for('login_page'))


# ========== STATIC FILE ROUTES ==========

@app.route('/')
def home():
    """Redirect root to index page (main form)"""
    return redirect(url_for('index'))


@app.route('/loginn.html')
def loginn_redirect():
    """Redirect old loginn.html URL to the login_page route"""
    return redirect(url_for('login_page'))


# ========== INDEX / FORM ROUTE ==========

@app.route('/index')
def index():
    """Serve index.html - main profile form"""
    try:
        with open(os.path.join(BASE_DIR, 'index.html'), 'r', encoding='utf-8') as f:
            return f.read()
    except Exception as e:
        print(f"Error serving index.html: {e}")
        return send_file(os.path.join(BASE_DIR, 'index.html'))


# ========== PROFILE ROUTES ==========

@app.route('/profiles')
@app.route('/profiles.html')
def profiles():
    """Serve profiles.html - protected"""
    if not session.get('logged_in'):
        return redirect(url_for('login_page', next='/profiles'))
    try:
        with open(os.path.join(BASE_DIR, 'profiles.html'), 'r', encoding='utf-8') as f:
            return f.read()
    except Exception as e:
        print(f"Error serving profiles.html: {e}")
        return send_file(os.path.join(BASE_DIR, 'profiles.html'))





# ========== API ENDPOINTS ========== profiles page data fetch and submit 

@app.route('/api/profiles', methods=['GET'])
def get_all_profiles():
    """Fetch all user profiles from database - protected"""
    if not session.get('logged_in'):
        return jsonify({"success": False, "error": "Unauthorized"}), 401

    try:
        conn = connect_db()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT id, name, email, password, country, state, country_code, phone_number, created_at FROM users ORDER BY created_at DESC")
        rows = cursor.fetchall()
        cursor.close()
        conn.close()

        profiles = [
            {
                "id": row["id"],
                "name": row["name"],
                "email": row["email"],
                "password": '********' if row.get("password") else '',
                "country": row["country"],
                "state": row["state"],
                "country_code": row["country_code"],
                "phone": row["phone_number"],
                "created_at": str(row["created_at"]) if row.get("created_at") else None
            }
            for row in rows
        ]
        return jsonify({"success": True, "profiles": profiles})
    except Exception as e:
        print(f"Error fetching profiles: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


# this is submm    it button  code to save data base
@app.route('/api/submit', methods=['POST'])
@app.route('/save', methods=['POST'])
def submit_profile():
    """Save a new user profile to database"""
    try:
        data = request.get_json()

        if not data:
            return jsonify({"success": False, "error": "No JSON data provided"}), 400

        name = data.get("name", "").strip()
        email = data.get("email", "").strip().lower()
        password = data.get("password", "").strip()
        country = data.get("country", "").strip()
        state = data.get("state", "").strip()
        country_code = data.get("country_code", "").strip()
        phone_number = data.get("phone_number", "").strip()

        # Validate required fields
        if not all([name, email, password, country, country_code, phone_number]):
            return jsonify({"success": False, "error": "Missing required fields"}), 400

        # Hash password before saving
        hashed_password = generate_password_hash(password)
        print(f"[POST] Saving profile: name={name}, email={email}, password=****, country={country}, state={state}, code={country_code}, phone={phone_number}")

        conn = connect_db()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO users (name, email, password, country, state, country_code, phone_number) VALUES (%s, %s, %s, %s, %s, %s, %s)",
            (name, email, hashed_password, country, state, country_code, phone_number)
        )
        conn.commit()
        user_id = cursor.lastrowid
        cursor.close()
        conn.close()

        print(f"[SUCCESS] Profile saved with ID: {user_id}")
        return jsonify({"success": True, "id": user_id})
    except Exception as e:
        print(f"Error saving profile: {e}")
        return jsonify({"success": False, "error": str(e)}), 500




# this is seesion code to check the user is login or not and also show the username in profile page and also show the logout button in profile page 
@app.route('/api/session_status', methods=['GET'])
def session_status():
    """Return simple session status for frontend checks"""
    return jsonify({
        "logged_in": bool(session.get('logged_in')),
        "username": session.get('username')
    })


# ========== COUNTRY & STATE ENDPOINTS ==========

@app.route('/countries', methods=['GET'])
def get_countries():
    """Get all countries with dial codes and country codes"""
    try:
        conn = connect_db()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT name, code, dial_code FROM countries ORDER BY name")
        rows = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify(rows)
    except Exception as e:
        print(f"Error fetching countries: {e}")
        return jsonify([])


@app.route('/states/<country_code>', methods=['GET'])
def get_states(country_code):
    """Get states/provinces for a country by country code"""
    country_code_upper = country_code.upper()
    try:
        conn = connect_db()
        cursor = conn.cursor()
        cursor.execute("SELECT state_name FROM states WHERE country_code = %s ORDER BY state_name", (country_code_upper,))
        rows = cursor.fetchall()
        cursor.close()
        conn.close()
        states = [r[0] for r in rows]
        return jsonify({"country_code": country_code_upper, "states": states})
    except Exception as e:
        print(f"Error fetching states for {country_code}: {e}")
        return jsonify({"country_code": country_code_upper, "states": []})





# ========== ENTRY POINT ========== server statpoint and startup info

if __name__ == '__main__':
    print("Flask Server Starting...")
    print(f"Base Directory: {BASE_DIR}")

    # Count countries and states from DB for startup info
    try:
        conn = connect_db()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM countries")
        countries_count = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(DISTINCT country_code) FROM states")
        states_count = cursor.fetchone()[0]
        cursor.close()
        conn.close()
    except Exception:
        countries_count = 'unknown'
        states_count = 'unknown'

    print(f"Countries loaded: {countries_count}")
    print(f"State mappings (distinct countries): {states_count}")
    print("=" * 60)
    print("Visit: http://127.0.0.1:5001")

    app.run(host='127.0.0.1', port=5001, debug=True)