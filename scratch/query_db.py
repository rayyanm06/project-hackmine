import sqlite3
import json

db_path = r"C:\project\smart_resort\backend\app.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = cursor.fetchall()
result = {}
for table in tables:
    table_name = table[0]
    cursor.execute(f"SELECT count(*) FROM {table_name}")
    result[table_name] = cursor.fetchone()[0]

print(json.dumps(result, indent=2))
