from sqlalchemy import Integer, String, ForeignKey
from sqlalchemy.orm import relationship, Mapped, mapped_column

from .base import Base

class Topic(Base):
    __tablename__ = "topics"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    
    facts = relationship("Fact", back_populates="topic", cascade="all, delete-orphan")