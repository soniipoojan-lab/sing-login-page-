import mysql.connector
from werkzeug.security import check_password_hash, generate_password_hash

#this code is to setup the database and table when we run the app.py file
# first time and also show the massage in console when database and table is ready ans also
# this code is to create the datbase and table 

def is_hashed_password(password):
    return password.startswith('pbkdf2:') or password.startswith('sha256$') or password.startswith('bcrypt$')


def setup_database():
    conn = mysql.connector.connect(
        host="localhost",
        user="root",
        password="123456"
    )
    cursor = conn.cursor()

    cursor.execute("CREATE DATABASE IF NOT EXISTS profile_db")
    cursor.execute("USE profile_db")

    # Users profile table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100),
        email VARCHAR(100),
        password VARCHAR(255),
        country VARCHAR(100),
        state VARCHAR(100),
        country_code VARCHAR(10),
        phone_number VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
    """)








# this code is to add missing columns in users table for older schemas
# where they might be missing

    cursor.execute("SHOW COLUMNS FROM users LIKE 'password'")
    if cursor.fetchone() is None:
        cursor.execute("ALTER TABLE users ADD COLUMN password VARCHAR(255)")

    cursor.execute("SHOW COLUMNS FROM users LIKE 'created_at'")
    if cursor.fetchone() is None:
        cursor.execute("ALTER TABLE users ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP")

    # Migrate existing plain passwords in users table to hashed values
    cursor.execute("SELECT id, password, email FROM users WHERE email IS NOT NULL")
    for user_id, stored_password, stored_email in cursor.fetchall():
        if stored_password and not is_hashed_password(stored_password):
            cursor.execute("UPDATE users SET password = %s WHERE id = %s", (generate_password_hash(stored_password), user_id))
        if stored_email:
            normalized_email = stored_email.strip().lower()
            if normalized_email != stored_email:
                cursor.execute("UPDATE users SET email = %s WHERE id = %s", (normalized_email, user_id))

    # Login credentials table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS login_users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    try:
        cursor.execute("ALTER TABLE login_users MODIFY password VARCHAR(255) NOT NULL")
    except Exception:
        pass

    # Countries table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS countries (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        code VARCHAR(10) NOT NULL UNIQUE,
        dial_code VARCHAR(20)
    )
    """)

    # States table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS states (
        id INT AUTO_INCREMENT PRIMARY KEY,
        country_code VARCHAR(10) NOT NULL,
        state_name VARCHAR(200) NOT NULL,
        UNIQUE KEY country_state (country_code, state_name)
    )
    """)







    

# this code is to normalize the usernames in the login_users table to lowercase and also hash 
# the passwords in the login_users table if they are not already hased

    cursor.execute("SELECT id, username, password FROM login_users")
    for user_id, stored_username, stored_password in cursor.fetchall():
        if stored_username:
            normalized_username = stored_username.strip().lower()
            if normalized_username != stored_username:
                try:
                    cursor.execute("UPDATE login_users SET username = %s WHERE id = %s", (normalized_username, user_id))
                except Exception:
                    # Ignore duplicate updates if normalization causes collisions
                    pass
        if stored_password and not is_hashed_password(stored_password):
            hashed = generate_password_hash(stored_password)
            cursor.execute("UPDATE login_users SET password = %s WHERE id = %s", (hashed, user_id))



#  this is api to use countries and states data in the form of dropdown in the profile page

    # Populate countries & states if empty
    cursor.execute("SELECT COUNT(*) FROM countries")
    if cursor.fetchone()[0] == 0:
        countries = [
            ("India", "IN", "+91"),
            ("United States", "US", "+1"),
            ("United Kingdom", "GB", "+44"),
            ("Canada", "CA", "+1"),
            ("Australia", "AU", "+61"),
            ("Germany", "DE", "+49"),
            ("France", "FR", "+33")
        ]
        cursor.executemany("INSERT INTO countries (name, code, dial_code) VALUES (%s, %s, %s)", countries)

    cursor.execute("SELECT COUNT(*) FROM states")
    if cursor.fetchone()[0] == 0:
        states = [
            ("IN", "Delhi"),("IN", "Maharashtra"),("IN", "Karnataka"),("IN", "Tamil Nadu"),("IN", "Uttar Pradesh"),("IN", "Gujarat"),("IN", "Goa"),("IN", "Goa"),
            ("US", "California"),("US", "New York"),("US", "Texas"),("US", "Florida"),("US", "Illinois"),
            ("GB", "England"),("GB", "Scotland"),("GB", "Wales"),("GB", "Northern Ireland"),
            ("CA", "Ontario"),("CA", "Quebec"),("CA", "British Columbia"),("CA", "Alberta"),
            ("AU", "New South Wales"),("AU", "Victoria"),("AU", "Queensland"),("AU", "Western Australia"),
            ("DE", "Bavaria"),("DE", "Berlin"),("DE", "North Rhine-Westphalia"),
            ("FR", "Paris"),("FR", "Marseille"),("FR", "Lyon")
        ]
        cursor.executemany("INSERT INTO states (country_code, state_name) VALUES (%s, %s)", states)

    conn.commit()
    cursor.close()
    conn.close()

    print("Database & Table Ready")
# ---------------------------------------