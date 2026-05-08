from app.models.base import Base
from sqlalchemy import Integer, String, Text, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime

class View(Base):
    __tablename__ = "views"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    fact_id: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)