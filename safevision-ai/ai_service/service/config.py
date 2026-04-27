from pydantic_settings import BaseSettings


class AISettings(BaseSettings):
    API_URL: str = "http://api:8000"
    REDIS_URL: str = "redis://redis:6379/0"
    INTERNAL_API_KEY: str = "safevision-internal-key-change-in-production"

    # Model paths
    YOLO_MODEL_PATH: str = "models/yolov8n.pt"
    WEAPON_MODEL_PATH: str = "models/weapon_detector.pt"
    ACTION_MODEL_PATH: str = "models/action_classifier.pt"

    # Detection thresholds
    VIOLENCE_CONFIDENCE_THRESHOLD: float = 0.65
    WEAPON_CONFIDENCE_THRESHOLD: float = 0.70
    BULLYING_CONFIDENCE_THRESHOLD: float = 0.60
    PERSON_CONFIDENCE_THRESHOLD: float = 0.50

    # Processing
    FRAME_SKIP: int = 3
    BATCH_SIZE: int = 4
    MAX_CONCURRENT_STREAMS: int = 20
    CLIP_BUFFER_SECONDS_BEFORE: int = 15
    CLIP_BUFFER_SECONDS_AFTER: int = 30

    model_config = {"env_file": ".env", "extra": "ignore"}


ai_settings = AISettings()
