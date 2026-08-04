from sqlmodel import SQLModel, create_engine, Session
from contextlib import asynccontextmanager
from fastapi import FastAPI


DATABASE_URL = "postgresql://postgres:dana@localhost:5432/asis"


engine = create_engine(
    DATABASE_URL,
    echo=True
)


def get_session():
    with Session(engine) as session:
        yield session



@asynccontextmanager
async def crear_tablas(app: FastAPI):

    SQLModel.metadata.create_all(engine)

    yield