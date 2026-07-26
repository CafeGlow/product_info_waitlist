# JAGAVE — Internal Documentation

> **Intended audience:** Internal team only. Not for external distribution.
> This file documents the codebase structure, stack decisions, and development workflow so anyone can pick it up and run.

---

## Table of Contents

- [Stack](#stack)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Backend: `server.py`](#backend-serverpy)
- [Frontend: Static Files](#frontend-static-files)
- [Waitlist Pipeline](#waitlist-pipeline)
- [Environment Variables](#environment-variables)
- [Deployment Notes](#deployment-notes)
- [Workflow & Conventions](#workflow--conventions)

---

## Stack

| Layer | Choice | Why |
|---|---|---|
| **Backend framework** | FastAPI | Modern, async-ready, auto OpenAPI docs at `/docs`. |
| **ASGI server** | Uvicorn | Standard for FastAPI. |
| **Database** | PostgreSQL (via SQLAlchemy ORM) | Reliable, well-supported; auto-creates `waitlist` table on startup. |
| **Email** | Resend | Simple API, generous free tier (100 emails/day), Python SDK. |
| **Env config** | python-dotenv | Loads `.env` at import time. |
| **Frontend** | Vanilla HTML / CSS / JS (no framework) | Served as static files by FastAPI. GSAP + Lenis for animation. |

---

## Project Structure

```
.
├── server.py          # FastAPI app: starts uvicorn, mounts static files, defines /api/waitlist
├── requirements.txt   # Python dependencies (pip install -r requirements.txt)
├── .env               # Environment variables (gitignored)
├── .gitignore
├── README.md          # This file
├── index.html         # Single-page frontend
├── style.css          # All styles
├── script.js          # All JS (GSAP animations + waitlist form submission)
└── data.json          # All content data (site copy, hero, ingredients, etc.)
```

---

## Quick Start

```bash
# 1. Create a virtual environment (recommended)
python3 -m venv venv
source venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure database & email
cp .env.example .env    # if you have an example file, otherwise edit .env directly
# Edit .env with your PostgreSQL credentials and Resend API key

# 4. Start the server
python server.py        # defaults to port 8000
python server.py 8080   # custom port

# 5. Open
#    http://localhost:8000  → frontend
#    http://localhost:8000/docs → API docs (Swagger)
```

**Note:** The server serves the frontend AND the API on the same port. No CORS issues in production.

---

## Backend: `server.py`

### Architecture

```
server.py
├── Load .env (python-dotenv)
├── Define SQLAlchemy model (WaitlistEntry → "waitlist" table)
├── Create FastAPI app
│   ├── Startup event → Base.metadata.create_all() (auto-creates table)
│   ├── POST /api/waitlist  → validates email → inserts → sends Resend email
│   └── Mount StaticFiles("/") → serves index.html, style.css, script.js, data.json
└── main() → uvicorn.run()
```

### API Endpoint

**`POST /api/waitlist`**

Request:
```json
{ "email": "user@example.com" }
```

Responses:
| Status | Meaning |
|---|---|
| `200` | Success — email added, welcome email sent (or skipped if no Resend key) |
| `409` | Duplicate — email already on the waitlist |
| `422` | Validation error — email missing or malformed |
| `503` | Database unavailable |

### Waitlist Table Schema

```sql
CREATE TABLE IF NOT EXISTS waitlist (
    id       SERIAL PRIMARY KEY,
    email    VARCHAR(320) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Resend Email

- Triggered immediately after a successful DB insert (fire-and-forget; doesn't block the HTTP response).
- If `RESEND_API_KEY` is empty or unset, the email step is skipped quietly (logged).
- `from` address uses Resend's test sender (`onboarding@resend.dev`) by default. Update to a verified domain when you have one.

---

## Frontend: Static Files

The frontend is a vanilla single-page app. All content lives in `data.json`. The flow:

1. `index.html` loads → `script.js` fetches `data.json` → populates DOM.
2. GSAP + Lenis handle scroll animations (hero reveal, word fade-in, horizontal pin, etc.).
3. The waitlist form at the bottom of the page sends a `POST /api/waitlist` with `{ email: "..." }`.

### Waitlist Form (`script.js` → `initializeWaitlistForm`)

- On submit: POST to `/api/waitlist` as JSON.
- On 200: Show success message from the response (replaces the placeholder from `data.json`).
- On 409: Show "already on the waitlist" message.
- On error: Show error in the form note area.
- Disables the submit button during the request to prevent double-submission.

---

## Waitlist Pipeline

```
User enters email → [frontend] POST /api/waitlist
                         ↓
                    [FastAPI] Validate email (Pydantic EmailStr)
                         ↓
                    [PostgreSQL] INSERT INTO waitlist (email, created_at)
                         ↓ (on success)
                    [Resend] Send welcome email (fire-and-forget)
                         ↓
                    Response → { message: "You are on the list..." }
```

---

## Environment Variables

| Variable | Default | Required | Description |
|---|---|---|---|
| `DB_HOST` | `localhost` | ✅ | PostgreSQL host |
| `DB_PORT` | `5432` | ✅ | PostgreSQL port |
| `DB_NAME` | `jagave_waitlist` | ✅ | PostgreSQL database name |
| `DB_USER` | `postgres` | ✅ | PostgreSQL user |
| `DB_PASSWORD` | (empty) | ✅ | PostgreSQL password |
| `RESEND_API_KEY` | (empty) | — | Resend API key. If empty, email is skipped gracefully. |
| `PORT` | `8000` | — | Server port (also accepts CLI arg: `python server.py 8080`) |

---

## Deployment Notes

- **Database:** Ensure PostgreSQL is running and accessible. The server auto-creates the `waitlist` table on startup.
- **Resend:** Set `RESEND_API_KEY` to a real API key (from [resend.com](https://resend.com)). The free tier allows 100 emails/day.
- **Verified domain:** Replace `onboarding@resend.dev` with your verified domain in the `from` field of `send_welcome_email()`.
- **Uvicorn production:** For production, consider using `gunicorn -k uvicorn.workers.UvicornWorker server:app` or running uvicorn directly with more workers.
- The `.env` file is gitignored (already in `.gitignore`).

---

## Workflow & Conventions

- **Branching:** `main` is the stable branch. Feature branches prefixed with `add/` or `fix/`.
- **Content edits:** All text is in `data.json` — no need to touch HTML for copy changes.
- **Adding deps:** Add to `requirements.txt` AND run `pip freeze | grep <pkg> >> requirements.txt` (but deduplicate).
- **Linting:** No linter configured yet. Try to keep Python consistent with the style in `server.py` (PEP-8-ish, 4-space indent).
- Always test the waitlist flow end-to-end: submit an email → check DB → check Resend dashboard.
