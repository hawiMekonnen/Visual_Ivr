from pathlib import Path
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent
ENV_PATH = BASE_DIR / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(ENV_PATH) if ENV_PATH.exists() else ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Database
    DATABASE_URL: str = "sqlite:///./dev.db"

    # JWT
    SECRET_KEY: str = "change-me-in-production-use-openssl-rand-hex-32"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 8  # 8 hours

    # Media / Audio
    MEDIA_DIR: str = "./media"
    MEDIA_URL_PREFIX: str = "/media"

    # Rate limiting
    RATE_LIMIT_PUBLIC: str = "60/minute"
    RATE_LIMIT_SESSION: str = "30/minute"

    # Agent connector: "dev" | "twilio"
    AGENT_CONNECTOR: Literal["dev", "twilio"] = "dev"
    DEFAULT_AGENT_EXTENSION: str = "8000"

    # Telephony (for future Twilio connector)
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_PHONE_NUMBER: str = ""

    # App
    DEFAULT_LOCALE: str = "en"
    APP_NAME: str = "Visual IVR"
    DEBUG: bool = False

    # AI Translation (Google Gemini)
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-3.5-flash-lite"

    # Google Cloud Text-to-Speech (high-quality Amharic Wavenet voice)
    GOOGLE_TTS_API_KEY: str = ""
    # Amharic female: am-ET-Wavenet-A  |  male: am-ET-Wavenet-B
    GOOGLE_TTS_VOICE: str = "am-ET-Wavenet-A"

    # Frontend base URL for SMS links
    FRONTEND_BASE_URL: str = "http://192.168.1.5:5173"

    # Telegram Bot Notification (100% Free Instant Mobile Delivery)
    TELEGRAM_BOT_TOKEN: str = ""
    TELEGRAM_CHAT_ID: str = ""

    # Android Local SMS Gateway (Use your own SIM card)
    ANDROID_GATEWAY_URL: str = ""
    ANDROID_GATEWAY_TOKEN: str = ""
    TEST_DESTINATION_PHONE: str = ""


def get_settings() -> Settings:
    return Settings()
