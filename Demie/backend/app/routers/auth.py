from fastapi import APIRouter, HTTPException, Depends
from app.database import get_db_session
import hashlib
import datetime
import random
import string
import secrets
from fastapi import BackgroundTasks
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from fastapi import APIRouter, Depends, HTTPException
from app.routers.config import settings # Ensure this path is correct


conf = ConnectionConfig(
    MAIL_USERNAME = settings.MAIL_USERNAME,
    MAIL_PASSWORD = settings.MAIL_PASSWORD,
    MAIL_FROM = settings.MAIL_FROM,
    MAIL_PORT = settings.MAIL_PORT,
    MAIL_SERVER = settings.MAIL_SERVER,
    MAIL_STARTTLS = settings.MAIL_STARTTLS,
    MAIL_SSL_TLS = settings.MAIL_SSL_TLS,
    USE_CREDENTIALS = True
)

router = APIRouter(tags=["Auth"])

def get_password_hash(password: str):
    """Generates a SHA-256 hash for secure storage. 
    Added safety check to prevent NoneType attribute errors."""
    if password is None:
        return None
    return hashlib.sha256(password.encode()).hexdigest()

def generate_session_id():
    """Generates a 6-character alphanumeric SID (e.g., 9LSKQA, 1ERN0P) 
    as seen in DeMIE Forensic Entry."""
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

@router.post("/auth/register")
async def register(user_data: dict, session=Depends(get_db_session)):
    """Creates a new Auditor node in the Neo4j database."""
    username = user_data.get("username")
    password = user_data.get("password")
    role = user_data.get("role", "AUDITOR")

    # Prevent crash by validating presence of data
    if not username or not password:
        raise HTTPException(status_code=400, detail="USERNAME_AND_PASSWORD_REQUIRED")

    # Check for existing node to prevent duplicates in the 9,841 node graph
    check_query = "MATCH (u:User {username: $username}) RETURN u"
    existing = await session.run(check_query, username=username)
    if await existing.single():
        raise HTTPException(status_code=400, detail="USER_ALREADY_EXISTS")

    new_sid = generate_session_id()
    
    create_query = """
    CREATE (u:User {
        username: $username,
        password_hash: $hash,
        role: $role,
        protocol: 'AES-256-GCM',
        session_id: $sid,
        created_at: datetime()
    })
    RETURN u.username as username
    """
    
    await session.run(create_query, 
                      username=username, 
                      hash=get_password_hash(password),
                      role=role,
                      sid=new_sid)

    return {"status": "User Created", "username": username, "session_id": new_sid}

@router.post("/auth/login")
async def login(credentials: dict, session=Depends(get_db_session)):
    username = credentials.get("username", "admin")
    password = credentials.get("password") 

    if not password:
        raise HTTPException(status_code=400, detail="PASSWORD_MISSING_FROM_REQUEST")

    # Modified query to check for ACTIVE status
    query = """
    MATCH (u:User {username: $username}) 
    RETURN u.password_hash as stored_hash, 
           u.session_id as sid, 
           u.protocol as protocol,
           u.status as status
    """
    res = await session.run(query, username=username)
    user_record = await res.single()
    
    if user_record:
        # Check if account is approved by admin
        if user_record.get("status") != "ACTIVE" and username != "admin":
            raise HTTPException(
                status_code=403, 
                detail="ACCOUNT_PENDING_ADMIN_APPROVAL"
            )

        if user_record["stored_hash"] == get_password_hash(password):
            return {
                "status": "success", 
                "token": "demie_jwt_v2",
                "protocol": user_record["protocol"],
                "session_id": user_record["sid"]
            }
    
    raise HTTPException(status_code=401, detail="INVALID_CREDENTIALS")

@router.post("/auth/forgot-password")
async def forgot_password(data: dict, session=Depends(get_db_session)):
    email = data.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="EMAIL_REQUIRED")

    # Check if user exists by email (Ensure your User nodes have an 'email' property)
    query = "MATCH (u:User {email: $email}) RETURN u.username as username"
    res = await session.run(query, email=email)
    user = await res.single()

    if not user:
        # For security, don't reveal if the email exists
        return {"status": "success", "message": "RESET_LINK_SENT_IF_EMAIL_EXISTS"}

    # Generate a secure reset token
    token = secrets.token_urlsafe(32)
    expiry = datetime.datetime.now() + datetime.timedelta(hours=1)

    # Store token in Neo4j attached to the User node
    update_query = """
    MATCH (u:User {email: $email})
    SET u.reset_token = $token, u.token_expiry = $expiry
    """
    await session.run(update_query, email=email, token=token, expiry=expiry.isoformat())

    # In a real app, use a background task to send the actual email
    # send_reset_email(email, token) 
    
    return {"status": "success", "message": "RESET_LINK_DISPATCHED", "debug_token": token}

@router.post("/auth/reset-password")
async def reset_password(data: dict, session=Depends(get_db_session)):
    token = data.get("token")
    new_password = data.get("password")

    if not token or not new_password:
        raise HTTPException(status_code=400, detail="INVALID_REQUEST_DATA")

    # Verify token and expiry
    query = """
    MATCH (u:User {reset_token: $token})
    WHERE u.token_expiry > $now
    RETURN u.username as username
    """
    res = await session.run(query, token=token, now=datetime.datetime.now().isoformat())
    user = await res.single()

    if not user:
        raise HTTPException(status_code=400, detail="INVALID_OR_EXPIRED_TOKEN")

    # Update password and clear token
    update_query = """
    MATCH (u:User {username: $username})
    SET u.password_hash = $hash, u.reset_token = null, u.token_expiry = null
    """
    await session.run(update_query, username=user['username'], hash=get_password_hash(new_password))

    return {"status": "success", "message": "PASSWORD_RECOVERED"}

@router.post("/auth/forgot-password")
async def forgot_password(data: dict, session=Depends(get_db_session)):
    email = data.get("email")
    
    # 1. Verify Auditor in Neo4j
    query = "MATCH (u:User {email: $email}) RETURN u.username as name"
    res = await session.run(query, email=email)
    user = await res.single()

    if user:
        # 2. Generate Recovery Token
        token = secrets.token_urlsafe(32)
        
        # 3. Store in DB with 15m Expiry
        update_query = "MATCH (u:User {email: $email}) SET u.reset_token = $t, u.expiry = datetime() + duration('PT15M')"
        await session.run(update_query, email=email, t=token)

        # 4. Dispatch Email
        message = MessageSchema(
            subject="DeMIE_FORENSIC_RECOVERY_PROTOCOL",
            recipients=[email],
            body=f"AUDITOR_ID: {user['name']}\n\nUse this token to reset your key: {token}",
            subtype="plain"
        )
        
        fm = FastMail(conf)
        await fm.send_message(message)

    return {"status": "success", "message": "RECOVERY_LINK_DISPATCHED"}