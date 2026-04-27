from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class Organization(TimestampMixin, Base):
    __tablename__ = "organizations"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    logo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_active: Mapped[bool] = mapped_column(default=True)

    # Billing
    stripe_customer_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    subscription_plan: Mapped[str] = mapped_column(String(50), default="standard")
    subscription_status: Mapped[str] = mapped_column(String(50), default="trial")

    # Relationships
    locations: Mapped[list["Location"]] = relationship(back_populates="organization", cascade="all, delete-orphan")  # noqa: F821
    users: Mapped[list["User"]] = relationship(back_populates="organization", cascade="all, delete-orphan")  # noqa: F821
