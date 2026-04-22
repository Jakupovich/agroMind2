from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables.

    Reads from a `.env` file when present. All fields are optional so the
    service runs out of the box for local development.
    """

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "AgroMind Backend"
    app_version: str = "0.1.0"
    environment: str = "development"

    # CORS
    cors_origins: list[str] = ["*"]

    # Open-Meteo
    open_meteo_base_url: str = "https://api.open-meteo.com/v1/forecast"
    http_timeout_seconds: float = 10.0

    # OpenAI (optional — rule-based fallback is used when unset)
    openai_api_key: str | None = None
    openai_model: str = "gpt-4o-mini"


@lru_cache
def get_settings() -> Settings:
    return Settings()
