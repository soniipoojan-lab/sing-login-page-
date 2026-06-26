from database import connect_db

try:
    conn = connect_db()
    cursor = conn.cursor(dictionary=True)
    
    # Check total users
    cursor.execute("SELECT COUNT(*) as count FROM users")
    result = cursor.fetchone()
    print(f"✓ Database connected!")
    print(f"✓ Total users in database: {result['count']}")
    
    # Show first 5 users
    if result['count'] > 0:
        cursor.execute("SELECT id, name, email, country FROM users LIMIT 5")
        users = cursor.fetchall()
        print("\nFirst users in database:")
        for user in users:
            print(f"  - ID: {user['id']}, Name: {user['name']}, Email: {user['email']}, Country: {user['country']}")
    
    cursor.close()
    conn.close()
except Exception as e:
    print(f"✗ Error: {e}")
