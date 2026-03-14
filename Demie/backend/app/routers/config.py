from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # SMTP Configuration for Recovery Protocol
    MAIL_USERNAME: str = "demie.forensics@gmail.com"
    MAIL_PASSWORD: str = "freh emci hlcx eqen"
    MAIL_FROM: str = "admin@demie-forensics.io"
    MAIL_PORT: int = 587
    MAIL_SERVER: str = "smtp.gmail.com"
    MAIL_STARTTLS: bool = True
    MAIL_SSL_TLS: bool = False

settings = Settings()