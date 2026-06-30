"""SMTP email delivery (used for password-reset links).

Sending is done with the stdlib ``smtplib`` inside a worker thread so it never
blocks the async event loop. If SMTP is not configured (``SMTP_HOST`` empty), the
message is logged instead of sent, which keeps local development working.
"""

from __future__ import annotations

import asyncio
import logging
import smtplib
from email.message import EmailMessage

from app.config.settings import get_settings

logger = logging.getLogger(__name__)


def _send_sync(to_email: str, subject: str, text_body: str, html_body: str) -> None:
    settings = get_settings()
    from_email = settings.smtp_from_email or settings.smtp_user

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = f"{settings.smtp_from_name} <{from_email}>"
    msg["To"] = to_email
    msg.set_content(text_body)
    msg.add_alternative(html_body, subtype="html")

    with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=20) as server:
        if settings.smtp_use_tls:
            server.starttls()
        if settings.smtp_user:
            server.login(settings.smtp_user, settings.smtp_password)
        server.send_message(msg)


async def send_email(to_email: str, subject: str, text_body: str, html_body: str) -> bool:
    """Send an email. Returns True if sent, False if SMTP is not configured."""
    settings = get_settings()
    if not settings.smtp_host:
        logger.warning(
            "SMTP not configured (SMTP_HOST empty). Email to %s NOT sent. Subject: %s",
            to_email,
            subject,
        )
        return False
    try:
        await asyncio.to_thread(_send_sync, to_email, subject, text_body, html_body)
        logger.info("Sent email to %s (subject: %s)", to_email, subject)
        return True
    except Exception as exc:  # noqa: BLE001 - surface as warning, caller decides
        logger.error("Failed to send email to %s: %s", to_email, exc)
        raise


async def send_password_reset_email(to_email: str, full_name: str, reset_link: str) -> bool:
    settings = get_settings()
    minutes = settings.password_reset_token_expire_minutes
    subject = "Reset your password — AI FYP Relevancy System"

    text_body = (
        f"Hi {full_name},\n\n"
        "We received a request to reset the password for your AI FYP Relevancy System "
        "account.\n\n"
        f"Open this link to set a new password (valid for {minutes} minutes):\n"
        f"{reset_link}\n\n"
        "If you did not request this, you can safely ignore this email — your password "
        "will remain unchanged.\n"
    )

    html_body = f"""\
<div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;color:#111827">
  <h2 style="color:#2563eb;margin-bottom:8px">Reset your password</h2>
  <p>Hi {full_name},</p>
  <p>We received a request to reset the password for your
     <strong>AI FYP Relevancy System</strong> account.</p>
  <p style="margin:24px 0">
    <a href="{reset_link}"
       style="background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 22px;
              border-radius:8px;display:inline-block;font-weight:600">
      Set a new password
    </a>
  </p>
  <p style="font-size:13px;color:#6b7280">
    This link is valid for {minutes} minutes. If the button does not work, copy and paste
    this URL into your browser:<br>
    <a href="{reset_link}" style="color:#2563eb;word-break:break-all">{reset_link}</a>
  </p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
  <p style="font-size:12px;color:#9ca3af">
    If you did not request a password reset, you can safely ignore this email —
    your password will remain unchanged.
  </p>
</div>"""

    return await send_email(to_email, subject, text_body, html_body)
