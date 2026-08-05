from sqlmodel import Session, SQLModel, create_engine
from typing import Annotated
from fastapi import FastAPI, Depends
from contextlib import asynccontextmanager

# 1. URL de conexión limpia (Sin ñ, sin caracteres raros). 
# Si NO tienes contraseña, se deja vacío entre los dos puntos (:)
url_bd = "postgresql://postgres:dana@localhost:5432/asis"

# 2. Motor de base de datos
motor_bd = create_engine(url_bd, echo=False)

# 3. Función lifespan para crear las tablas al iniciar
@asynccontextmanager
async def lifespan(app: FastAPI):
    SQLModel.metadata.create_all(motor_bd)
    yield  # Aquí la aplicación queda corriendo

# 4. Función para obtener la sesión (Inyección de dependencias)
def obtener_sesion():
    with Session(motor_bd) as mi_sesion:
        yield mi_sesion

Sesion_dependencia = Annotated[Session, Depends(obtener_sesion)]