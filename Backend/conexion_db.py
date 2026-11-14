import os
from sqlmodel import Session, SQLModel, create_engine
from sqlalchemy.engine import make_url
from typing import Annotated
from fastapi import FastAPI, Depends
from contextlib import asynccontextmanager

# 1. URL de conexión DESDE VARIABLE DE ENTORNO (con fallback para desarrollo local)
url_bd = os.getenv(
    "DATABASE_URL", 
    "postgresql+psycopg2://postgres:1234@localhost:5432/asisdb"
)

# 2. Motor de base de datos
motor_bd = create_engine(url_bd, echo=False)

# Conexión limitada para autenticación y activación de cuentas.
url_auth = make_url(url_bd).set(
    username="asis_app_auth",
    password=os.environ["ASIS_DB_AUTH_PASSWORD"]
)

motor_auth = create_engine(
    url_auth,
    echo=False,
    pool_pre_ping=True
)

# Conexión PostgreSQL para el administrador de ASIS
url_admin = make_url(url_bd).set(
    username="asis_app_admin",
    password=os.environ["ASIS_DB_ADMIN_PASSWORD"]
)

# ==========================================
# CONEXIONES POSTGRESQL POR ROL
# ==========================================

motor_admin = create_engine(
    url_admin,
    echo=False,
    pool_pre_ping=True
)

def obtener_sesion_admin():
    with Session(motor_admin) as sesion:
        yield sesion

Sesion_admin = Annotated[
    Session,
    Depends(obtener_sesion_admin)
]

# Instructor
url_instructor = make_url(url_bd).set(
    username="asis_app_instructor",
    password=os.environ["ASIS_DB_INSTRUCTOR_PASSWORD"]
)

motor_instructor = create_engine(
    url_instructor,
    echo=False,
    pool_pre_ping=True
)


# Técnico
url_tecnico = make_url(url_bd).set(
    username="asis_app_tecnico",
    password=os.environ["ASIS_DB_TECNICO_PASSWORD"]
)

motor_tecnico = create_engine(
    url_tecnico,
    echo=False,
    pool_pre_ping=True
)


# Administrador de mesa de ayuda
url_mesa = make_url(url_bd).set(
    username="asis_app_mesa",
    password=os.environ["ASIS_DB_MESA_PASSWORD"]
)

motor_mesa = create_engine(
    url_mesa,
    echo=False,
    pool_pre_ping=True
)


# Cuentadante
url_cuentadante = make_url(url_bd).set(
    username="asis_app_cuentadante",
    password=os.environ["ASIS_DB_CUENTADANTE_PASSWORD"]
)

motor_cuentadante = create_engine(
    url_cuentadante,
    echo=False,
    pool_pre_ping=True
)

# 3. Función lifespan para crear las tablas al iniciar
@asynccontextmanager
async def lifespan(app: FastAPI):
    SQLModel.metadata.create_all(motor_bd)
    yield

# 4. Función para obtener la sesión
def obtener_sesion():
    with Session(motor_bd) as mi_sesion:
        yield mi_sesion

Sesion_dependencia = Annotated[Session, Depends(obtener_sesion)]