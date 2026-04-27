from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class Location(TimestampMixin, Base):
    __tablename__ = "locations"

    id: Mapped[int] = mapped_column(primary_key=True)
    organization_id: Mapped[int] = mapped_column(ForeignKey("organizations.id"), index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    location_type: Mapped[str] = mapped_column(String(50), default="school")
    is_active: Mapped[bool] = mapped_column(default=True)
    timezone: Mapped[str] = mapped_column(String(50), default="UTC")

    # Relationships
    organization: Mapped["Organization"] = relationship(back_populates="locations")  # noqa: F821
    zones: Mapped[list["Zone"]] = relationship(back_populates="location", cascade="all, delete-orphan")
    cameras: Mapped[list["Camera"]] = relationship(back_populates="location", cascade="all, delete-orphan")  # noqa: F821


class Zone(TimestampMixin, Base):
    __tablename__ = "zones"

    id: Mapped[int] = mapped_column(primary_key=True)
    location_id: Mapped[int] = mapped_column(ForeignKey("locations.id"), index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    zone_type: Mapped[str] = mapped_column(String(50), default="hallway")
    risk_score: Mapped[float] = mapped_column(default=0.0)
    is_active: Mapped[bool] = mapped_column(default=True)

    # Relationships
    location: Mapped["Location"] = relationship(back_populates="zones")
    cameras: Mapped[list["Camera"]] = relationship(back_populates="zone")  # noqa: F821
