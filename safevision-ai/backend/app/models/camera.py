from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class Camera(TimestampMixin, Base):
    __tablename__ = "cameras"

    id: Mapped[int] = mapped_column(primary_key=True)
    location_id: Mapped[int] = mapped_column(ForeignKey("locations.id"), index=True)
    zone_id: Mapped[int | None] = mapped_column(ForeignKey("zones.id"), nullable=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    rtsp_url: Mapped[str] = mapped_column(String(500), nullable=False)
    camera_type: Mapped[str] = mapped_column(String(50), default="ip")
    status: Mapped[str] = mapped_column(String(50), default="active")
    is_active: Mapped[bool] = mapped_column(default=True)
    thumbnail_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Detection settings
    detection_enabled: Mapped[bool] = mapped_column(default=True)
    violence_detection: Mapped[bool] = mapped_column(default=True)
    bullying_detection: Mapped[bool] = mapped_column(default=False)
    weapon_detection: Mapped[bool] = mapped_column(default=False)

    # Relationships
    location: Mapped["Location"] = relationship(back_populates="cameras")  # noqa: F821
    zone: Mapped["Zone | None"] = relationship(back_populates="cameras")  # noqa: F821
    incidents: Mapped[list["Incident"]] = relationship(back_populates="camera")  # noqa: F821
