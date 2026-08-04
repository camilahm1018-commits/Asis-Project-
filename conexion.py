from sqlmodel import Session, SQLModel, create_engine
from typing import Annotated
from fastapi import FastAPI, Depends

# 1. Cambia la URL para apuntar a tu servidor PostgreSQL
# Estructura: postgresql://usuario:contraseña@servidor:puerto/nombre_bd
# REEMPLAZA 'tu_contraseña' por la clave que le asignaste al usuario postgres
url_bd = "postgresql://postgres:@localhost:5432/asis"

# motor de base de datos (PostgreSQL no necesita los argumentos de SQLite)
motor_bd = create_engine(url_bd)

# Definir el metodo para crear las tablas
def crear_tablas(app: FastAPI):
    SQLModel.metadata.create_all(motor_bd)
    yield # no hay nada para retornar o ejecutar

# Definir el metodo para la sesión
def obtener_sesion():
    with Session(motor_bd) as mi_sesion:
        yield mi_sesion # retorna la sesion
        
# Denominado inyección de dependencias
# registrar la sesion como dependencia, utilizada en nuestros endpoints
Sesion_dependencia = Annotated[Session, Depends(obtener_sesion)]

