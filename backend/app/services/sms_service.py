import httpx
import structlog
from app.config import get_settings

log = structlog.get_logger(__name__)


async def send_sms_notification(to_phone: str, message_text: str) -> dict:
    """
    Sends an SMS notification to the caller's phone number containing the Visual IVR link.
    Supports Telegram (100% Free), Android Local SIM Gateway, Twilio, and Dev Mode.
    """
    settings = get_settings()

    # Resolve destination phone number (if caller is internal extension like 1001, route to test phone)
    target_phone = to_phone
    cleaned_digits = "".join(c for c in to_phone if c.isdigit())
    if len(cleaned_digits) <= 4 and settings.TEST_DESTINATION_PHONE:
        target_phone = settings.TEST_DESTINATION_PHONE

    log.info(
        "sms_dispatch_request",
        to_phone=target_phone,
        original_caller=to_phone,
        message=message_text,
    )

    # 1. Telegram Bot Delivery (100% Free, Instant on Mobile in Ethiopia)
    if settings.TELEGRAM_BOT_TOKEN and settings.TELEGRAM_CHAT_ID:
        tg_url = f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}/sendMessage"
        tg_payload = {
            "chat_id": settings.TELEGRAM_CHAT_ID,
            "text": f"📲 *Visual IVR Triggered for {to_phone}*\n\n{message_text}",
            "parse_mode": "Markdown",
        }
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(tg_url, json=tg_payload)
                if res.status_code == 200:
                    log.info("telegram_notification_sent", to=to_phone)
                    return {"status": "sent", "provider": "telegram", "to": to_phone}
                else:
                    log.error("telegram_send_failed", status=res.status_code, body=res.text)
        except Exception as e:
            log.error("telegram_exception", error=str(e))

    # 2. Android Phone Local SMS Gateway (Uses local SIM card via HTTP)
    if settings.ANDROID_GATEWAY_URL:
        gateway_url = settings.ANDROID_GATEWAY_URL
        if not gateway_url.endswith("/"):
            gateway_url = f"{gateway_url}/"

        headers = {"Content-Type": "application/json"}
        if settings.ANDROID_GATEWAY_TOKEN:
            headers["Authorization"] = settings.ANDROID_GATEWAY_TOKEN

        payload = {
            "to": target_phone,
            "message": message_text,
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(
                    gateway_url,
                    json=payload,
                    headers=headers,
                )
                if res.status_code in (200, 201, 202):
                    log.info("android_gateway_sms_sent", to=target_phone, response=res.text)
                    return {"status": "sent", "provider": "android_gateway", "to": target_phone}
                else:
                    # Fallback retry with /message if root returned 404
                    if res.status_code == 404 and not gateway_url.endswith("/message/"):
                        fallback_url = f"{gateway_url.rstrip('/')}/message"
                        res_retry = await client.post(fallback_url, json=payload, headers=headers)
                        if res_retry.status_code in (200, 201, 202):
                            log.info("android_gateway_sms_sent", to=target_phone, response=res_retry.text)
                            return {"status": "sent", "provider": "android_gateway", "to": target_phone}
                    log.error("android_gateway_error", status=res.status_code, body=res.text)
        except Exception as e:
            log.error("android_gateway_exception", error=str(e))

    # 3. Twilio SMS Gateway (if configured)
    if settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN and settings.TWILIO_PHONE_NUMBER:
        url = f"https://api.twilio.com/2010-04-01/Accounts/{settings.TWILIO_ACCOUNT_SID}/Messages.json"
        auth = (settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        payload = {
            "From": settings.TWILIO_PHONE_NUMBER,
            "To": to_phone,
            "Body": message_text,
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(url, data=payload, auth=auth)
                if res.status_code in (200, 201):
                    data = res.json()
                    log.info("twilio_sms_sent", sid=data.get("sid"), to=to_phone)
                    return {"status": "sent", "provider": "twilio", "sid": data.get("sid")}
                else:
                    log.error("twilio_sms_failed", status=res.status_code, body=res.text)
                    return {"status": "error", "provider": "twilio", "details": res.text}
        except Exception as e:
            log.error("twilio_sms_exception", error=str(e))
            return {"status": "error", "provider": "twilio", "error": str(e)}

    # 4. Local / Console Simulation
    log.info(
        "dev_sms_simulated",
        to=to_phone,
        body=message_text,
    )
    return {
        "status": "simulated",
        "provider": "dev_console",
        "to": to_phone,
        "message": message_text,
    }
