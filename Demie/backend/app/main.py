from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, forensics 

app = FastAPI(title="DeMIE Forensic Engine")

# --- CORS CONFIGURATION ---
origins = ["http://localhost:3000", "http://localhost:5173"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# CENTRALIZED PREFIXING (Crucial for fixing 404s)
app.include_router(auth.router, prefix="/api")
app.include_router(forensics.router, prefix="/api")

@app.get("/")
async def root():
    return {"status": "DeMIE Backend Online"}