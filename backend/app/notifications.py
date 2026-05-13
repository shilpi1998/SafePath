"""Real notification services - Twilio SMS + Email alerts."""
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config import (
    TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER,
    SMTP_EMAIL, SMTP_PASSWORD, SMTP_HOST, SMTP_PORT,
)

logger = logging.getLogger(__name__)


def send_sms(to_phone: str, message: str) -> dict:
    """Send SMS via Twilio."""
    logger.info(f"Attempting SMS to {to_phone} from {TWILIO_PHONE_NUMBER}")
    logger.info(f"Twilio config - SID: {TWILIO_ACCOUNT_SID[:10]}..., Phone: {TWILIO_PHONE_NUMBER}")

    if not all([TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER]):
        reason = f"Twilio not configured - SID: {'set' if TWILIO_ACCOUNT_SID else 'missing'}, Token: {'set' if TWILIO_AUTH_TOKEN else 'missing'}, Phone: {'set' if TWILIO_PHONE_NUMBER else 'missing'}"
        logger.warning(reason)
        return {"status": "skipped", "reason": reason}

    # Ensure phone has country code
    phone = to_phone.strip()
    if not phone.startswith("+"):
        phone = "+91" + phone  # Default to India
        logger.info(f"Added country code, sending to: {phone}")

    try:
        from twilio.rest import Client
        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        msg = client.messages.create(
            body=message,
            from_=TWILIO_PHONE_NUMBER,
            to=phone,
        )
        logger.info(f"SMS sent successfully! SID: {msg.sid}")
        return {"status": "sent", "sid": msg.sid}
    except Exception as e:
        logger.error(f"SMS failed: {e}")
        return {"status": "failed", "error": str(e)}


def send_email(to_email: str, subject: str, body: str) -> dict:
    """Send email alert via Gmail SMTP."""
    if not all([SMTP_EMAIL, SMTP_PASSWORD]):
        return {"status": "skipped", "reason": "Email not configured"}

    try:
        msg = MIMEMultipart()
        msg["From"] = SMTP_EMAIL
        msg["To"] = to_email
        msg["Subject"] = subject

        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
            <div style="background: #DC2626; color: white; padding: 20px; border-radius: 10px; text-align: center;">
                <h1 style="margin: 0;">SOS EMERGENCY ALERT</h1>
            </div>
            <div style="padding: 20px; background: #FEF2F2; border-radius: 10px; margin-top: 10px;">
                {body}
            </div>
            <p style="color: #666; font-size: 12px; margin-top: 20px;">
                This is an automated emergency alert from SafePath. Please respond immediately.
            </p>
        </body>
        </html>
        """
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_EMAIL, SMTP_PASSWORD)
            server.send_message(msg)

        return {"status": "sent"}
    except Exception as e:
        logger.error(f"Email failed: {e}")
        return {"status": "failed", "error": str(e)}


def send_sos_alerts(user_name: str, latitude: float, longitude: float, contacts: list) -> list:
    """Send SOS alerts to all emergency contacts via both SMS and Email."""
    google_maps_link = f"https://www.google.com/maps?q={latitude},{longitude}"

    sms_message = (
        f"EMERGENCY SOS from {user_name}! "
        f"They need immediate help. "
        f"Location: {google_maps_link} "
        f"Please respond or call emergency services. - SafePath"
    )

    email_subject = f"EMERGENCY SOS Alert from {user_name} - SafePath"
    email_body = f"""
        <h2 style="color: #DC2626;">Your contact {user_name} has triggered an SOS alert!</h2>
        <p><strong>They need immediate help.</strong></p>
        <p><strong>Location:</strong> <a href="{google_maps_link}">View on Google Maps</a></p>
        <p>Coordinates: {latitude}, {longitude}</p>
        <br>
        <p><strong>What to do:</strong></p>
        <ul>
            <li>Try calling them immediately</li>
            <li>If they don't respond, call emergency services (112)</li>
            <li>Share their location with authorities</li>
        </ul>
    """

    results = []
    for contact in contacts:
        result = {"name": contact.name, "phone": contact.phone, "email": contact.email}

        # Send SMS
        sms_result = send_sms(contact.phone, sms_message)
        result["sms_status"] = sms_result["status"]
        if sms_result.get("error"):
            result["sms_error"] = sms_result["error"]
        if sms_result.get("reason"):
            result["sms_reason"] = sms_result["reason"]

        # Send Email
        if contact.email:
            email_result = send_email(contact.email, email_subject, email_body)
            result["email_status"] = email_result["status"]
            if email_result.get("error"):
                result["email_error"] = email_result["error"]
        else:
            result["email_status"] = "skipped"

        results.append(result)

    return results
