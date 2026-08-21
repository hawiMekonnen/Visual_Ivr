from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

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


@lru_cache
def get_settings() -> Settings:
    return Settings()
