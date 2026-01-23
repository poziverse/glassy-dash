
import sqlite3
import os

db_path = "/home/pozicontrol/projects/glassy-dash/GLASSYDASH/server/data.sqlite"

try:
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    print("Deleting notes...")
    c.execute("DELETE FROM notes")
    deleted_notes = c.rowcount
    
    print("Deleting collaborators...")
    c.execute("DELETE FROM note_collaborators")
    deleted_collabs = c.rowcount
    
    conn.commit()
    conn.close()
    
    print(f"SUCCESS: Deleted {deleted_notes} notes and {deleted_collabs} collaborator records.")
except Exception as e:
    print(f"ERROR: {e}")
