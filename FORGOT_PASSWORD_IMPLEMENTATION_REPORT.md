# Forgot Password — Implementation Report

_Date: 2026-07-01_

## The problem
"Forgot password" was **not working** because the feature was never implemented:

- **Frontend:** the "Forgot password?" text was a dead link (`<a href="#">`) with no action.
- **Backend:** there was **no** password-reset endpoint at all (`/auth` only had
  register, login, refresh, logout, me).
- **No email/SMTP** was configured anywhere in the app.

## What was built
A complete, secure, **email-based password reset** flow.

```
User clicks "Forgot password?"  →  enters email
   →  backend emails a reset link (valid 30 min)
   →  user opens link  →  sets a new password
   →  can sign in with the new password
```

### Security design (no database changes needed)
The reset link uses a **stateless, single-use JWT token**:
- Signed with the app secret, `type = "reset"`, expires in 30 minutes.
- Embeds a short **fingerprint of the current password hash** (`fp`).
- When the password is changed, the hash changes, so the fingerprint no longer
  matches → **the link can only be used once** and old links die automatically.
- **No account enumeration:** `/auth/forgot-password` always returns the same
  message whether or not the email exists.

Verified behaviour (automated checks):
| Check | Result |
|-------|--------|
| Token decodes with correct user + type | PASS |
| Fingerprint matches current hash | PASS |
| Fingerprint **mismatches** after password change (single-use) | PASS |
| Garbage token rejected | PASS |
| A normal access token cannot be used as a reset token | PASS |
| `forgot-password` for existing + unknown email runs without error | PASS |

---

## Files changed / added

### Backend
| File | Change |
|------|--------|
| `app/config/settings.py` | Added SMTP settings, `frontend_base_url`, `password_reset_token_expire_minutes` |
| `.env` / `.env.example` | Added `FRONTEND_BASE_URL` + `SMTP_*` config (with Gmail example) |
| `app/auth/security.py` | `password_fingerprint()`, `create_password_reset_token()`, `verify_password_reset_token()` |
| `app/services/email_service.py` | **New** — sends email via SMTP in a worker thread (HTML + text) |
| `app/services/auth_service.py` | `request_password_reset()`, `reset_password()` |
| `app/schemas/auth.py` | `ForgotPasswordRequest`, `ResetPasswordRequest`, `MessageResponse` |
| `app/routes/auth.py` | `POST /auth/forgot-password`, `POST /auth/reset-password` |

### Frontend
| File | Change |
|------|--------|
| `services/authService.ts` | `requestPasswordReset()`, `resetPassword()` |
| `components/ForgotPassword.tsx` | **New** — enter email → "check your email" |
| `components/ResetPassword.tsx` | **New** — set + confirm new password |
| `components/Login.tsx` | "Forgot password?" is now a working button |
| `App.tsx` | New `forgot-password` / `reset-password` screens; reads `?reset_token=` from the email link URL |

---

## API

`POST /auth/forgot-password`
```json
{ "email": "user@uol.edu.pk" }
```
→ `200 { "message": "If an account exists for that email, a password reset link has been sent." }`

`POST /auth/reset-password`
```json
{ "token": "<from email link>", "new_password": "newSecret123" }
```
→ `200 { "message": "Your password has been updated. You can now sign in with your new password." }`
→ `400` if the link is invalid, expired, or already used.

---

## ⚠️ Action required from you: configure SMTP

Emails will **only actually send once you fill in SMTP credentials** in
`backend/.env`. Until then, the system works but the reset link is written to the
**backend console log** instead of being emailed (handy for local testing).

### Gmail setup (recommended, free)
1. Enable 2-Step Verification on the Google account.
2. Create an **App Password**: https://myaccount.google.com/apppasswords
3. In `backend/.env` set:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=youraddress@gmail.com
   SMTP_PASSWORD=your-16-char-app-password
   SMTP_FROM_EMAIL=youraddress@gmail.com
   SMTP_USE_TLS=true
   FRONTEND_BASE_URL=http://localhost:5173
   ```
4. Restart the backend. Done — reset emails will now be delivered.

> `FRONTEND_BASE_URL` must point to where your frontend runs (e.g. your Vercel URL
> in production) so the link in the email opens the correct site.

---

## How to test
1. Set SMTP in `.env` (or watch the backend log for the link if you don't).
2. Frontend → **Forgot password?** → enter a registered email.
3. Open the link from the email (or paste the logged URL) → set a new password.
4. Sign in with the new password. The old reset link will no longer work.
