import mysql.connector
from app.config import settings

def get_connection(db_name: str = "attendance_ml_db"):
    return mysql.connector.connect(
        host=settings.MYSQL_HOST,
        port=settings.MYSQL_PORT,
        user=settings.MYSQL_USER,
        password=settings.MYSQL_PASSWORD,
        database=db_name
    )

def fetch_one(db_name: str, query: str, params: tuple = ()):
    conn = get_connection(db_name)
    cursor = conn.cursor(dictionary=True)
    cursor.execute(query, params)
    result = cursor.fetchone()
    cursor.close()
    conn.close()
    return result

def fetch_all(db_name: str, query: str, params: tuple = ()):
    conn = get_connection(db_name)
    cursor = conn.cursor(dictionary=True)
    cursor.execute(query, params)
    results = cursor.fetchall()
    cursor.close()
    conn.close()
    return results

def execute_insert_or_update(db_name: str, query: str, params: tuple = ()):
    conn = get_connection(db_name)
    cursor = conn.cursor()
    cursor.execute(query, params)
    conn.commit()
    last_id = cursor.lastrowid
    cursor.close()
    conn.close()
    return last_id
