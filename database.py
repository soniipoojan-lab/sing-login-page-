# this code is to connect the databsase and also create the database and table 
import mysql.connector

def connect_db():
    conn = mysql.connector.connect(
        host="localhost",
        user="root",
        password="123456",
        database="profile_db"
    )
    return conn