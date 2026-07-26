"""
JAGAVE Waitlist Server
=======================
FastAPI backend that:
  - Serves the static frontend files
  - Accepts waitlist email submissions via POST /api/waitlist
  - Stores emails in PostgreSQL (auto-creates table on startup)
  - Sends a welcome confirmation email via Resend

Usage:
    python server.py [port]

Environment variables (load from .env via python-dotenv):
  DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD  — PostgreSQL credentials
  RESEND_API_KEY                                    — Resend API key for email
"""

import os
import sys
import logging
from pathlib import Path

from dotenv import load_dotenv

# ── Load .env before anything else ──────────────────────────────────────────
load_dotenv()

# ── Imports that may depend on env vars ────────────────────────────────────
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from sqlalchemy import (
    create_engine,
    Column,
    Integer,
    String,
    DateTime,
    func,
    text,
)
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import declarative_base, sessionmaker

# ── Logging ─────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
)
logger = logging.getLogger("jagave")

# ── Port ────────────────────────────────────────────────────────────────────
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else int(os.getenv("PORT", "8000"))

# ── Database ────────────────────────────────────────────────────────────────
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "jagave_waitlist")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")

DATABASE_URL = (
    f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# ── Waitlist Model ──────────────────────────────────────────────────────────
class WaitlistEntry(Base):
    __tablename__ = "waitlist"

    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(320), unique=True, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# ── Pydantic Schemas ────────────────────────────────────────────────────────
class WaitlistRequest(BaseModel):
    email: EmailStr


class WaitlistResponse(BaseModel):
    message: str


# ── FastAPI App ─────────────────────────────────────────────────────────────
app = FastAPI(title="JAGAVE Waitlist API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Startup: create tables ──────────────────────────────────────────────────
@app.on_event("startup")
def startup():
    """Create the waitlist table if it doesn't exist."""
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables checked/created successfully.")
    except Exception as exc:
        logger.warning(
            "Could not connect to PostgreSQL (%s). "
            "Waitlist endpoint will return 503 until the database is available.",
            exc,
        )


# ── Resend helper ───────────────────────────────────────────────────────────
def send_welcome_email(to_email: str) -> bool:
    """
    Send a welcome/confirmation email via Resend.
    Returns True if sent successfully, False otherwise.
    """
    api_key = os.getenv("RESEND_API_KEY", "")
    if not api_key or not api_key.startswith("re_"):
        logger.info("Resend API key not configured; skipping welcome email to %s", to_email)
        return False

    try:
        import resend

        resend.api_key = api_key
        params = {
            "from": "JAGAVE <onboarding@resend.dev>",
            "to": [to_email],
            "subject": "You're on the waitlist!",
            "html": (
                "<div style='font-family: Inter, sans-serif; max-width: 480px; margin: 0 auto;'>"
                "  <h2 style='font-family: Georgia, serif; font-weight: 300; color: #1C1917;'>"
                "    You're on the list."
                "  </h2>"
                "  <p style='color: #555; line-height: 1.6;'>"
                "    Thank you for joining the JAGAVE waitlist. "
                "    We'll send quiet notes from the studio, release timing, "
                "    and an invitation when the first pour is ready."
                "  </p>"
                "  <hr style='border: 0; border-top: 1px solid #eee; margin: 1.5rem 0;'>"
                "  <p style='color: #888; font-size: 0.85rem;'>"
                "    — JAGAVE Studio · Kyoto ↔ Brooklyn"
                "  </p>"
                "</div>"
            ),
        }
        response = resend.Emails.send(params)
        logger.info("Welcome email sent to %s (id=%s)", to_email, response.get("id"))
        return True
    except Exception as exc:
        logger.warning("Failed to send welcome email to %s: %s", to_email, exc)
        return False


# ── API Endpoint ────────────────────────────────────────────────────────────
@app.post("/api/waitlist", response_model=WaitlistResponse)
def join_waitlist(payload: WaitlistRequest):
    """
    Add an email to the waitlist and send a welcome confirmation.

    Expects JSON: { "email": "user@example.com" }
    Returns 201 on success, 409 if already registered, 503 if DB unavailable.
    """
    db = SessionLocal()
    try:
        # Test connectivity
        db.execute(text("SELECT 1"))

        entry = WaitlistEntry(email=payload.email)
        db.add(entry)
        db.commit()
        db.refresh(entry)

        logger.info("Waitlist entry created: %s (id=%s)", payload.email, entry.id)

        # Fire-and-forget welcome email (don't block response on email)
        send_welcome_email(payload.email)

        return WaitlistResponse(
            message="You are on the list. We will write when the first pour is ready."
        )

    except IntegrityError:
        db.rollback()
        logger.info("Duplicate waitlist attempt: %s", payload.email)
        raise HTTPException(
            status_code=409,
            detail="This email is already on the waitlist.",
        )
    except Exception as exc:
        db.rollback()
        logger.error("Database error processing %s: %s", payload.email, exc)
        raise HTTPException(
            status_code=503,
            detail="Waitlist is temporarily unavailable. Please try again later.",
        )
    finally:
        db.close()


# ── Serve static frontend ──────────────────────────────────────────────────
frontend_dir = Path(__file__).parent.resolve()
app.mount("/", StaticFiles(directory=str(frontend_dir), html=True), name="frontend")


# ── Entrypoint ──────────────────────────────────────────────────────────────
def main():
    import uvicorn

    logger.info("Starting JAGAVE server on http://0.0.0.0:%d", PORT)
    logger.info("API docs at http://localhost:%d/docs", PORT)
    uvicorn.run(
        "server:app",
        host="0.0.0.0",
        port=PORT,
        reload=False,
        log_level="info",
    )


if __name__ == "__main__":
    main()
