from fastapi import FastAPI
from conexion_db import lifespan
from enrutadores import roles, asig_tec, ticket, estados_ticket, His_tickets, Usuarios,ER_ambientes,ER_equipos,motivo_novedad,notificaciones,tipo_equipo,tipo_documento,dashboard,auth

asis = FastAPI(lifespan=lifespan, title="ASIS API")

@asis.get("/")
def prueba():
    return {"mensaje": "Servidor ASIS conectado correctamente"}

# Registrar todos los routers
asis.include_router(roles.asis)
asis.include_router(asig_tec.asis)
asis.include_router(ticket.asis)
asis.include_router(estados_ticket.asis)
asis.include_router(His_tickets.asis)
asis.include_router(Usuarios.asis)
asis.include_router(ER_equipos.asis)
asis.include_router(ER_ambientes.asis)
asis.include_router(motivo_novedad.asis)
asis.include_router(notificaciones.asis)
asis.include_router(tipo_equipo.asis)
asis.include_router(tipo_documento.asis)
asis.include_router(dashboard.asis)
asis.include_router(auth.asis)