import hashlib
from neo4j import GraphDatabase

# Your connection details from Neo4j Desktop
URI = "bolt://localhost:7687" 
AUTH = ("neo4j", "your_password")

def delete_user(username):
    with GraphDatabase.driver(URI, auth=AUTH) as driver:
        with driver.session() as session:
            session.run("MATCH (u:User {username: $u}) DELETE u", u=username)
            print(f"[-] User {username} purged from forensic index.")

def list_auditors():
    with GraphDatabase.driver(URI, auth=AUTH) as driver:
        with driver.session() as session:
            result = session.run("MATCH (u:User) RETURN u.username, u.role, u.session_id")
            print("\n--- ACTIVE FORENSIC AUDITORS ---")
            for record in result:
                print(f"ID: {record[2]} | USER: {record[0]} | ROLE: {record[1]}")

# Usage Examples:
# delete_user("temp_user")
list_auditors()

def toggle_auditor_status(username, active=True):
    """Activates or Deactivates an auditor's forensic access"""
    with GraphDatabase.driver(URI, auth=AUTH) as driver:
        with driver.session() as session:
            session.run(
                "MATCH (u:User {username: $u}) SET u.status = $status", 
                u=username, status="ACTIVE" if active else "PENDING"
            )
            print(f"[*] Auditor {username} status updated to {'ACTIVE' if active else 'PENDING'}")

@router.get("/api/admin/auditors")
async def get_all_auditors(session=Depends(get_db_session)):
    """Fetches all registered forensic identities for the management panel"""
    query = "MATCH (u:User) RETURN u.username as username, u.role as role, u.session_id as sid, u.status as status"
    res = await session.run(query)
    return [record.data() for record in await res.data()]