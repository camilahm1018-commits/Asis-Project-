from fastapi import FastAPI
from Enrutador import His_tickets
from conexion import crear_tablas
from Enrutador import Usuarios
from Enrutador import estados_ticket

asis = FastAPI (lifespan=crear_tablas, title="ASIS API")


@asis.get("/")
def prueba():
    return {"prueba" : "Servidor conectado"}

asis.include_router(Usuarios.asis)
asis.include_router(His_tickets.asis)
asis.include_router(estados_ticket.asis)