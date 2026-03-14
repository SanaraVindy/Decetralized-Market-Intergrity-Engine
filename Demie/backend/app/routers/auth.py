from fastapi import APIRouter, HTTPException, Depends, Request
from app.database import get_db_session
import hashlib
import datetime
import random
import string
import secrets
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from app.routers.config import settings

# 1. Configuration for Mail Dispatch
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

# --- Helper Utilities ---

def get_password_hash(password: str):
    """Generates a SHA-256 hash for secure storage."""
    if password is None:
        return None
    return hashlib.sha256(password.encode()).hexdigest()

def generate_session_id():
    """Generates a 6-character alphanumeric SID """
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

async def create_audit_log(username: str, action: str, details: str, session):
    """
    Creates a forensic log node in Neo4j linked to the User.
    This creates a 'Graph of Activity' for forensic auditing.
    """
    query = """
    MATCH (u:User {username: $username})
    CREATE (l:Log {
        action: $action,
        details: $details,
        timestamp: datetime(),
        status: 'SUCCESS'
    })
    CREATE (u)-[:PERFORMED]->(l)
    """
    await session.run(query, username=username, action=action, details=details)

# --- API Endpoints ---

@router.post("/auth/register")
async def register(user_data: dict, session=Depends(get_db_session)):
    """
    Creates a new Auditor node, logs the identity initialization,
    and dispatches a welcome email.
    """
    username = user_data.get("username")
    password = user_data.get("password")
    email = user_data.get("email")
    role = user_data.get("role", "AUDITOR")

    if not username or not password or not email:
        raise HTTPException(status_code=400, detail="USERNAME_PASSWORD_AND_EMAIL_REQUIRED")

    # 1. Check if Auditor already exists in Graph
    check_query = "MATCH (u:User {username: $username}) RETURN u"
    existing = await session.run(check_query, {"username": username})
    if await existing.single():
        raise HTTPException(status_code=400, detail="USER_ALREADY_EXISTS")

    # 2. Generate Session ID and Create Node
    new_sid = generate_session_id()
    create_query = """
    CREATE (u:User {
        username: $username,
        email: $email,
        password_hash: $hash,
        role: $role,
        status: 'ACTIVE',
        protocol: 'AES-256-GCM',
        session_id: $sid,
        created_at: datetime()
    })
    RETURN u.username as username
    """
    
    await session.run(create_query, {
        "username": username, 
        "email": email,
        "hash": get_password_hash(password),
        "role": role,
        "sid": new_sid
    })

    # 3. AUDIT LOG: Identity Created (Forensic Trace)
    await create_audit_log(username, "IDENTITY_CREATED", "New forensic auditor node initialized in graph", session)

    # 4. DISPATCH REGISTRATION EMAIL
    message = MessageSchema(
        subject="DeMIE | Identity Initialization Successful",
        recipients=[email],
        from_address=f"DeMIE Forensic Portal <{settings.MAIL_FROM}>",
        body=f"""
        <div style="font-family: 'Courier New', monospace; background-color: #020617; color: #f8fafc; padding: 40px; border: 1px solid #1e293b;">
            <h2 style="color: #10b981; border-bottom: 1px solid #10b981; padding-bottom: 10px;">[IDENTITY INITIALIZED]</h2>
            <p style="margin-top: 20px;">Welcome, Auditor <strong>{username}</strong>.</p>
            <p>Your account has been successfully provisioned within the DeMIE Decentralized Market Integrity Engine.</p>
            
            <div style="background: #1e293b; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; font-size: 13px;"><strong>ROLE:</strong> {role}</p>
                <p style="margin: 5px 0 0 0; font-size: 13px;"><strong>SESSION_ID:</strong> {new_sid}</p>
                <p style="margin: 5px 0 0 0; font-size: 13px;"><strong>PROTOCOL:</strong> AES-256-GCM</p>
            </div>
            
            <p>You may now access the Forensic Dashboard to monitor Sybil activity.</p>
            
            <div style="margin: 30px 0;">
                <a href="http://localhost:3000/login" style="background-color: #10b981; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                    ACCESS DASHBOARD
                </a>
            </div>
            
            <p style="font-size: 10px; color: #64748b;">TIMESTAMP: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')} UTC</p>
            <p style="font-size: 10px; color: #64748b;">SECURE_ORIGIN: NODE_01_SRI_LANKA</p>
        </div>
        """,
        subtype=MessageType.html
    )

    try:
        fm = FastMail(conf)
        await fm.send_message(message)
    except Exception as e:
        # We don't want to fail registration if the email fails, 
        # but we should log it in the console.
        print(f"[REG_MAIL_ERROR]: {e}")

    return {"status": "User Created", "username": username, "session_id": new_sid}

@router.post("/auth/login")
async def login(credentials: dict, session=Depends(get_db_session)):
    """Authenticates user and logs the session initialization."""
    username = credentials.get("username")
    password = credentials.get("password") 

    if not username or not password:
        raise HTTPException(status_code=400, detail="CREDENTIALS_MISSING")

    query = """
    MATCH (u:User {username: $username}) 
    RETURN u.password_hash as stored_hash, 
           u.session_id as sid, 
           u.protocol as protocol
    """
    res = await session.run(query, username=username)
    user_record = await res.single()
    
    if user_record:
        if user_record["stored_hash"] == get_password_hash(password):
            # AUDIT LOG: Successful Login
            await create_audit_log(username, "LOGIN_SUCCESS", "Forensic session authenticated via cryptographic key", session)
            
            return {
                "status": "success", 
                "token": "demie_jwt_v2",
                "protocol": user_record["protocol"],
                "session_id": user_record["sid"]
            }
        else:
            # AUDIT LOG: Failed Password
            await create_audit_log(username, "LOGIN_FAIL", "Unauthorized access attempt: Invalid Key", session)
    
    raise HTTPException(status_code=401, detail="INVALID_CREDENTIALS")

@router.post("/auth/reset-password")
async def reset_password(data: dict, session=Depends(get_db_session)):
    """
    Finalizes the Credential Rotation:
    1. Validates the recovery token and expiry.
    2. Updates the password hash in the Graph.
    3. Dispatches a 'Security Alert' confirmation email.
    """
    token = data.get("token")
    new_password = data.get("password")

    if not token or not new_password:
        raise HTTPException(status_code=400, detail="INVALID_REQUEST_DATA")

    # 1. Verify Token and Expiry in Neo4j
    query = """
    MATCH (u:User {reset_token: $token})
    WHERE u.token_expiry > datetime()
    RETURN u.username as username, u.email as email
    """
    res = await session.run(query, {"token": token})
    user_record = await res.single()

    if not user_record:
        # Trace failed attempt in console for forensic monitoring
        print(f"[SECURITY_ALERT] Invalid or expired token attempt: {token}")
        raise HTTPException(status_code=400, detail="INVALID_OR_EXPIRED_TOKEN")

    username = user_record['username']
    email_address = user_record['email']

    # 2. Update Credentials and Clear Recovery Fields
    update_query = """
    MATCH (u:User {username: $username})
    SET u.password_hash = $hash, 
        u.reset_token = null, 
        u.token_expiry = null
    """
    await session.run(update_query, {
        "username": username, 
        "hash": get_password_hash(new_password)
    })

    # 3. Create Audit Log (Graph of Activity)
    await create_audit_log(
        username, 
        "CREDENTIAL_ROTATION", 
        "Auditor security key updated via recovery protocol. Reset token invalidated.", 
        session
    )

    # 4. Dispatch Confirmation Email
    message = MessageSchema(
        subject="DeMIE | Security Alert: Credential Rotation",
        recipients=[email_address],
        from_address=f"DeMIE Forensic Portal <{settings.MAIL_FROM}>",
        body=f"""
        <div style="font-family: 'Courier New', monospace; background-color: #020617; color: #f8fafc; padding: 40px; border: 1px solid #1e293b; max-width: 600px; margin: auto;">
            <div style="text-align: center; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 20px;">
                <h1 style="color: #3b82f6; margin: 0; letter-spacing: 4px;">DeMIE</h1>
                <p style="color: #64748b; font-size: 12px; margin: 5px 0 0 0;">Decentralized Market Integrity Engine</p>
            </div>

            <h3 style="color: #3b82f6;">[CREDENTIAL ROTATION SUCCESSFUL]</h3>
            <p>Auditor: <strong>{username}</strong></p>
            <p>The security credentials for your forensic node have been successfully updated.</p>
            
            <div style="background: #1e293b; padding: 15px; margin: 20px 0; border-radius: 4px; border: 1px solid #334155;">
                <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                    If you did not perform this action, your identity may be compromised. 
                    Please initialize a <strong>System Lockdown</strong> immediately.
                </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="http://localhost:3000/login" style="background-color: #3b82f6; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">
                    RETURN TO LOGIN
                </a>
            </div>
            
            <p style="font-size: 10px; color: #475569; text-align: center; border-top: 1px solid #1e293b; padding-top: 20px;">
                TIMESTAMP: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')} UTC | NODE_ID: SRI_AUTH_01
            </p>
        </div>
        """,
        subtype=MessageType.html
    )

    try:
        fm = FastMail(conf)
        await fm.send_message(message)
    except Exception as e:
        print(f"[MAIL_ERROR]: Confirmation email failed to dispatch: {e}")

    return {"status": "success", "message": "PASSWORD_RECOVERED"}
@router.post("/auth/forgot-password")
async def forgot_password(data: dict, session=Depends(get_db_session)):
    """
    Identity Recovery Protocol: 
    1. Verifies Auditor credentials in Neo4j.
    2. Generates a secure cryptographic reset token.
    3. Dispatches the recovery email with DeMIE Branding.
    """
    email_address = data.get("email") # Renamed to avoid NameError
    username = data.get("username")

    if not email_address or not username:
        raise HTTPException(status_code=400, detail="EMAIL_AND_USERNAME_REQUIRED")

    # 1. Verify Auditor exists in the Graph
    query = """
    MATCH (u:User)
    WHERE toLower(u.email) = toLower($email) AND u.username = $username
    RETURN u.username as username, u.email as email
    """
    res = await session.run(query, email=email_address, username=username)
    user_record = await res.single()

    if not user_record:
        raise HTTPException(status_code=404, detail="AUDITOR_NOT_FOUND")

    # 2. Generate a secure 32-byte token and set 1-hour expiry
    reset_token = secrets.token_urlsafe(32)
    
    update_query = """
    MATCH (u:User {username: $username})
    SET u.reset_token = $token, 
        u.token_expiry = datetime() + duration('PT1H')
    """
    await session.run(update_query, username=username, token=reset_token)

    # 3. Create Forensic Audit Log
    await create_audit_log(
        username, 
        "RECOVERY_INITIATED", 
        "Secure reset token generated and injected into node properties", 
        session
    )

    # 4. Prepare and Send Branded Email
    reset_link = f"http://localhost:3000/reset-password?token={reset_token}"
    
    message = MessageSchema(
        subject="DeMIE | Identity Recovery Protocol",
        recipients=[user_record["email"]],
        from_address=f"DeMIE Forensic Portal <{settings.MAIL_FROM}>",
        body=f"""
        <div style="font-family: 'Courier New', monospace; background-color: #020617; color: #f8fafc; padding: 40px; border: 1px solid #1e293b; max-width: 600px; margin: auto;">
            
            <div style="text-align: center; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 20px;">
                <h1 style="color: #3b82f6; margin: 0; letter-spacing: 4px; font-size: 28px;">DeMIE</h1>
                <p style="color: #64748b; font-size: 10px; margin: 5px 0 0 0; text-transform: uppercase; tracking-widest: 2px;">
                    Decentralized Market Integrity Engine
                </p>
            </div>

            <h3 style="color: #3b82f6; text-transform: uppercase;">[IDENTITY RECOVERY PROTOCOL]</h3>
            
            <p style="margin-top: 20px;">Auditor Identification: <strong>{username}</strong></p>
            <p>A credential rotation has been requested. Access the link below to initialize the reset sequence. This token will expire in <strong>60 minutes</strong>.</p>
            
            <div style="text-align: center; margin: 40px 0;">
                <a href="{reset_link}" style="background-color: #2563eb; color: #ffffff; padding: 15px 35px; text-decoration: none; border-radius: 4px; font-weight: bold; text-transform: uppercase; display: inline-block; border: 1px solid #3b82f6;">
                    Initialize Reset
                </a>
            </div>
            
            <div style="background: #0f172a; padding: 15px; border-radius: 4px; border-left: 4px solid #3b82f6;">
                <p style="font-size: 11px; color: #94a3b8; margin: 0;">
                    <strong>SECURITY_NOTE:</strong> If you did not initialize this protocol, your credentials may be under a Sybil-related brute force attempt. Contact System Admin immediately.
                </p>
            </div>

            <p style="font-size: 10px; color: #475569; text-align: center; margin-top: 30px; border-top: 1px solid #1e293b; padding-top: 20px;">
                NODE_STATUS: RECOVERY_PENDING | DISPATCH_ID: {secrets.token_hex(4).upper()} | PROTOCOL: TLS_V1.3
            </p>
        </div>
        """,
        subtype=MessageType.html
    )

    try:
        fm = FastMail(conf)
        await fm.send_message(message)
        return {"status": "success", "message": "RECOVERY_LINK_DISPATCHED"}
    except Exception as e:
        print(f"SMTP Dispatch Error: {e}")
        raise HTTPException(status_code=500, detail="MAIL_SYSTEM_OFFLINE")