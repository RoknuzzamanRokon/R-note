from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.engine import URL
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app import config

_url = URL.create(
    "mysql+pymysql",
    username=config.DB_USER,
    password=config.DB_PASSWORD,
    host=config.DB_HOST,
    port=config.DB_PORT,
    database=config.DB_NAME,
    query={"charset": "utf8mb4"},
)

_connect_args: dict = {}
if config.DB_SSL:
    # With a CA file the server certificate is verified; without one the
    # connection is still encrypted but the certificate is not checked.
    _connect_args["ssl"] = {"ca": config.DB_SSL_CA} if config.DB_SSL_CA else {"check_hostname": False}

engine = create_engine(
    _url,
    connect_args=_connect_args,
    pool_pre_ping=True,
    pool_recycle=280,
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables() -> None:
    from app import models  # noqa: F401  (registers the tables)

    Base.metadata.create_all(engine)
