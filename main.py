from fastapi import FastAPI
from conexion_db import lifespan
from enrutadores import roles, asig_tec, ticket, estados_ticket, His_tickets, Usuarios,ER_ambientes,ER_equipos,motivo_no_reparacion,notificaciones,tipo_equipo

asis = FastAPI(lifespan=lifespan)

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
asis.include_router(motivo_no_reparacion.asis)
asis.include_router(notificaciones.asis)
asis.include_router(tipo_equipo.asis)