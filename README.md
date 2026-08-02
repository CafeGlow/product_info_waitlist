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
| **Database** | Turso (libSQL/SQLite via SQLAlchemy ORM) | Hosted SQLite with an auto-created `waitlist` table. |
| **Email** | Resend | Simple API, generous free tier (100 emails/day), Python SDK. |
| **Env config** | python-dotenv | Loads `.env` at import time. |
| **Frontend** | Vanilla HTML / CSS / JS (no framework) | Served as static files by FastAPI. GSAP + Lenis for animation. |

---

## Project Structure

```
.
├── server.py          # FastAPI app: starts uvicorn, mounts static files, defines /api/waitlist
├── requirements.txt   # Python dependencies (pip install -r requirements.txt)
├── .env.example       # Template for environment variables (copy to .env)
├── .env               # Real env values (gitignored)
├── .gitignore
├── README.md          # This file
├── LAUNCH_CHECKLIST.md# Pre-launch readiness checklist
├── image-prompts.md   # Prompts for the 11 placeholder images
│
├── index.html         # Single-page frontend (home)
├── privacy.html       # Privacy Policy
├── terms.html         # Terms of Service
├── 404.html           # Branded 404 page
├── style.css          # All styles
├── script.js          # All JS (GSAP animations + waitlist form submission)
├── data.json          # All content data (site copy, hero, ingredients, etc.)
│
├── favicon.svg        # Site favicon (linked from every page)
├── robots.txt         # SEO crawl rules
│
└── images/            # Drop the 11 product / hero images here (see image-prompts.md)
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
# Add your Turso auth token and Resend API key to .env

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
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    email      VARCHAR(320) UNIQUE NOT NULL,
    source     VARCHAR(64),                   -- attribution: utm_source / ref / source from the form
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

On startup, the server checks `PRAGMA table_info(waitlist)` and, for an older table, runs:

```sql
ALTER TABLE waitlist ADD COLUMN source VARCHAR(64);
```

The statement is only executed when the column is absent, making startup idempotent. For larger future schema changes, switch to Alembic.

### Resend Email

- Triggered immediately after a successful DB insert (fire-and-forget; doesn't block the HTTP response).
- If `RESEND_API_KEY` is empty or unset, the email step is skipped quietly (logged).
- The `from` address is built from `RESEND_FROM_NAME` and `RESEND_FROM_EMAIL` (defaults: `JAGAVE <onboarding@resend.dev>`). Replace these with a verified domain before launch.
- The email includes a `List-Unsubscribe` header and a visible unsubscribe link to comply with CAN-SPAM and Gmail's sender requirements.

---

## Frontend: Static Files

The frontend is a vanilla single-page app. All content lives in `data.json`. The flow:

1. `index.html` loads → `script.js` fetches `data.json` → populates DOM.
2. GSAP + Lenis handle scroll animations (hero reveal, word fade-in, horizontal pin, etc.).
3. The waitlist form at the bottom of the page sends a `POST /api/waitlist` with `{ email: "..." }`.

### Waitlist Form (`script.js` → `initializeWaitlistForm`)

- On submit: POST to `/api/waitlist` as JSON: `{ email, source? }`.
- The `source` field is read from URL params (`?utm_source=`, `?ref=`, or `?source=`) on page load and is stored alongside the email for attribution. It is silently truncated to 64 chars.
- A required privacy consent checkbox must be ticked before submission; an unchecked box shows a non-blocking error in the form note.
- On 200: Show success message from the response (replaces the placeholder from `data.json`).
- On 409: Show "already on the waitlist" message.
- On error: Show error in the form note area.
- Disables the submit button during the request to prevent double-submission.

---

## Waitlist Pipeline

```
User enters email + consent → [frontend] POST /api/waitlist
                                    ↓
                              [FastAPI] Validate email (Pydantic EmailStr)
                                    ↓
                              [Turso/SQLite] INSERT INTO waitlist (email, source, created_at)
                                    ↓ (on success)
                              [Resend] Send welcome email with List-Unsubscribe header
                                    ↓
                              Response → { message: "You are on the list..." }
```

---

## Environment Variables

| Variable | Default | Required | Description |
|---|---|---|---|
| `TURSO_DATABASE_URL` | `libsql://globrewwaitlist-pulkit3010.aws-ap-northeast-1.turso.io` | — | Turso database URL. Override with `sqlite:///...` for local development. |
| `TURSO_AUTH_TOKEN` | (empty) | ✅ in prod | Turso database authentication token. Obtain it from the Turso CLI/dashboard; never commit it. |
| `RESEND_API_KEY` | (empty) | — | Resend API key. If empty, email is skipped gracefully. |
| `RESEND_FROM_EMAIL` | `onboarding@resend.dev` | — | Sender email. Replace with a verified domain address before launch. |
| `RESEND_FROM_NAME` | `JAGAVE` | — | Sender display name used in the `From` field. |
| `PUBLIC_ORIGIN` | `http://localhost:8000` | ✅ in prod | Public site origin (no trailing slash). Used for CORS and the unsubscribe URL inside emails. |
| `PORT` | `8000` | — | Server port (also accepts CLI arg: `python server.py 8080`) |

---

## Deployment Notes

- **Database:** Set `TURSO_AUTH_TOKEN` in the deployment environment. The configured database is `globrewwaitlist-pulkit3010` in Turso's AWS Tokyo region. The server auto-creates the `waitlist` table and applies its idempotent SQLite schema check on startup.
- **Resend:** Set `RESEND_API_KEY` to a real API key (from [resend.com](https://resend.com)). The free tier allows 100 emails/day.
- **Verified domain:** Before launch, verify your sending domain in Resend and update `RESEND_FROM_EMAIL` to an address on that domain. The default `onboarding@resend.dev` only delivers to your own Resend account.
- **`PUBLIC_ORIGIN`:** Must be set to the deployed URL (e.g. `https://jagave.com`) so the CORS allowlist matches and the unsubscribe link inside emails points at the real site. No trailing slash.
- **Images:** Drop the 11 product / hero photos into `images/` using the filenames in `image-prompts.md` (e.g. `images/hero-coffee-morning.jpg`, `images/ingredient-arabica.jpg`). `data.json` already references these local paths.
- **Static assets:** `index.html`, `privacy.html`, `terms.html`, `404.html`, `favicon.svg`, `robots.txt`, `style.css`, `script.js`, and `data.json` are served by FastAPI's `StaticFiles` mount.
- **Uvicorn production:** For production, consider using `gunicorn -k uvicorn.workers.UvicornWorker server:app` or running uvicorn directly with more workers.
- The `.env` file is gitignored (already in `.gitignore`).

---

## Workflow & Conventions

- **Branching:** `main` is the stable branch. Feature branches prefixed with `add/` or `fix/`.
- **Content edits:** All text on the home page is in `data.json` — no need to touch HTML for copy changes.
- **Legal pages:** `privacy.html` and `terms.html` are hand-edited. They are not data-driven. Review with counsel before launch.
- **Adding deps:** Add to `requirements.txt` AND run `pip freeze | grep <pkg> >> requirements.txt` (but deduplicate).
- **Linting:** No linter configured yet. Try to keep Python consistent with the style in `server.py` (PEP-8-ish, 4-space indent).
- **Schema changes:** For now, small additive changes go in the `startup()` migration block. Anything destructive (renames, type changes, drops) should move to Alembic.
- Always test the waitlist flow end-to-end: submit an email → check DB → check Resend dashboard → click unsubscribe.
