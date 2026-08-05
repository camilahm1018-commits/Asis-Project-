from typing import Annotated
from fastapi import Depends
from sqlmodel import Session, create_engine

DATABASE_URL = "postgresql://postgres:1234@localhost:5432/gestion_reparaciones"

engine = create_engine(
    DATABASE_URL,
    echo=True
)

def get_session():
    with Session(engine) as session:
        yield session

sesion_dependencia = Annotated[
    Session,
    Depends(get_session)
]