import os
import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from dotenv import load_dotenv

# Cargar variables de entorno del archivo .env.test en la raíz
load_dotenv(".env.test")

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(DATABASE_URL)

@pytest.fixture(name="session")
def session_fixture():
    with Session(engine) as session:
        yield session

@pytest.fixture(name="client")
def client_fixture(session: Session):
    from app.main import app  # Ajusta según la importación real de tu FastAPI
    def get_session_override():
        return session
    app.dependency_overrides[app.router] = get_session_override
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()