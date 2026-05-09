from sqlalchemy import Integer, String, Text, DateTime, func, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from app.models.base import Base

class Fact(Base):
    __tablename__ = "facts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    topic_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("topics.id", ondelete="SET NULL"), nullable=True)
    source: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    
    views = relationship("View", back_populates="fact", cascade="all, delete-orphan")
    topic = relationship("Topic", back_populates="facts")
