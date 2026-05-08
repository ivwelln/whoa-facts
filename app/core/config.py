from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DEBUG: bool
    DATABASE_URL: str
    ANTHROPIC_API_KEY: str

    class Config:
        env_file = ".env"
        
settings = Settings()