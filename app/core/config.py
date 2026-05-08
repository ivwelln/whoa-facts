from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DEBUG: bool
    DATABASE_URL: str
    
    ANTHROPIC_API_KEY: str
    
    GEMINI_API_KEY: str
    GEMINI_INSTRUCTION: str
    
    YANDEX_API_KEY: str
    
    TOPIC_MODE: str
    
    ADMIN_TOKEN: str

    class Config:
        env_file = ".env"
        
settings = Settings()