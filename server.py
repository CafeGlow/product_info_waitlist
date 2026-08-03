"""
JAGAVE Waitlist Server
=======================
FastAPI backend that:
  - Serves the static frontend files
  - Accepts waitlist email submissions via POST /api/waitlist
  - Stores emails in Turso (libSQL/SQLite; auto-creates table on startup)
  - Sends a welcome confirmation email via Resend

Usage:
    python server.py [port]

Environment variables (load from .env via python-dotenv):
  TURSO_DATABASE_URL, TURSO_AUTH_TOKEN              — Turso connection details
  RESEND_API_KEY                                    — Resend API key for email
  RESEND_FROM_EMAIL, RESEND_FROM_NAME              — Sender identity (verified domain)
  PUBLIC_ORIGIN                                     — Public site origin (for CORS + email links)
"""

import os
import sys
import logging
from pathlib import Path
from urllib.parse import quote

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
TURSO_DATABASE_URL = os.getenv(
    "TURSO_DATABASE_URL",
    "libsql://globrewwaitlist-pulkit3010.aws-ap-northeast-1.turso.io",
)
TURSO_AUTH_TOKEN = os.getenv("TURSO_AUTH_TOKEN", "")


def _build_engine():
    """Build the SQLAlchemy engine for Turso (libsql) or local SQLite.

    `sqlalchemy-libsql` 0.2.0's URL parser drops `authToken` from the query
    string before it reaches `libsql.connect()`, so Turso always rejects the
    connection with `empty JWT token`. We hand libsql the token directly via
    a `creator` while keeping the libsql dialect so its `on_connect` skips
    `create_function` (which libsql does not support).
    """
    if TURSO_DATABASE_URL.startswith("libsql://"):
        import libsql_experimental as libsql

        def _creator():
            return libsql.connect(TURSO_DATABASE_URL, auth_token=TURSO_AUTH_TOKEN)

        return create_engine(
            "sqlite+libsql://",
            creator=_creator,
            pool_pre_ping=True,
        )

    # Fallback for local SQLite (e.g. testing without Turso).
    return create_engine(TURSO_DATABASE_URL, pool_pre_ping=True)


engine = _build_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# ── Public config ──────────────────────────────────────────────────────────
PUBLIC_ORIGIN = os.getenv("PUBLIC_ORIGIN", "http://localhost:8000").rstrip("/")
RESEND_FROM_EMAIL = os.getenv("RESEND_FROM_EMAIL", "onboarding@resend.dev")
RESEND_FROM_NAME = os.getenv("RESEND_FROM_NAME", "JAGAVE")


# ── Waitlist Model ──────────────────────────────────────────────────────────
class WaitlistEntry(Base):
    __tablename__ = "waitlist"

    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(320), unique=True, nullable=False, index=True)
    source = Column(String(64), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# ── Pydantic Schemas ────────────────────────────────────────────────────────
class WaitlistRequest(BaseModel):
    email: EmailStr
    source: str | None = None


class WaitlistResponse(BaseModel):
    message: str


# ── FastAPI App ─────────────────────────────────────────────────────────────
app = FastAPI(title="JAGAVE Waitlist API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[PUBLIC_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Startup: create tables ──────────────────────────────────────────────────
@app.on_event("startup")
def startup():
    """Create the waitlist table if it doesn't exist, and apply lightweight migrations."""
    try:
        Base.metadata.create_all(bind=engine)
        # SQLite does not support ADD COLUMN IF NOT EXISTS. Inspecting the
        # schema first keeps this lightweight migration safe on every boot.
        with engine.begin() as conn:
            columns = {
                row[1] for row in conn.execute(text("PRAGMA table_info(waitlist)"))
            }
            if "source" not in columns:
                conn.execute(text("ALTER TABLE waitlist ADD COLUMN source VARCHAR(64)"))
        logger.info("Database tables checked/created successfully.")
    except Exception as exc:
        logger.warning(
            "Could not connect to Turso (%s). "
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

    unsubscribe_url = f"{PUBLIC_ORIGIN}/unsubscribe?email={quote(to_email)}"

    try:
        import resend

        resend.api_key = api_key
        params = {
            "from": f"{RESEND_FROM_NAME} <{RESEND_FROM_EMAIL}>",
            "to": [to_email],
            "subject": "You're on the JAGAVE waitlist",
            "headers": {
                "List-Unsubscribe": f"<{unsubscribe_url}>",
                "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
            },
            "html": (
                "<div style='font-family: Inter, sans-serif; max-width: 480px; margin: 0 auto; padding: 1rem;'>"
                "  <h2 style='font-family: Georgia, serif; font-weight: 300; color: #1C1917; margin: 0 0 1rem;'>"
                "    You're on the list."
                "  </h2>"
                "  <p style='color: #444; line-height: 1.65; margin: 0 0 1rem;'>"
                "    Thank you for joining the JAGAVE waitlist. "
                "    We'll send quiet notes from the studio, release timing, "
                "    and an invitation when the first pour is ready."
                "  </p>"
                "  <p style='color: #444; line-height: 1.65; margin: 0 0 1.5rem;'>"
                "    If you'd prefer not to hear from us, you can unsubscribe at any time."
                "  </p>"
                "  <hr style='border: 0; border-top: 1px solid #eee; margin: 1.5rem 0;'>"
                "  <p style='color: #888; font-size: 0.8rem; line-height: 1.5; margin: 0;'>"
                f"    &mdash; {RESEND_FROM_NAME} Studio<br>"
                f"    <a href='{unsubscribe_url}' style='color: #888;'>Unsubscribe</a>"
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

        # Normalise source to a safe length before persisting.
        source = (payload.source or "").strip()[:64] or None

        entry = WaitlistEntry(email=payload.email, source=source)
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
        # libsql-experimental surfaces UNIQUE-constraint failures as a raw
        # ValueError rather than SQLAlchemy's IntegrityError, so detect that
        # here as well and translate it to 409.
        if "UNIQUE constraint failed" in str(exc):
            logger.info("Duplicate waitlist attempt: %s", payload.email)
            raise HTTPException(
                status_code=409,
                detail="This email is already on the waitlist.",
            )
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
