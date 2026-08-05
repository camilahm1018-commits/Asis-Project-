from fastapi import FastAPI
from conexion_db import crear_tablas
from enrutadores import ER_ambientes,ER_equipos,roles,asig_tec,ticket,estado_tk,Usuarios,His_tickets,estados_ticket


app = FastAPI(
    lifespan=crear_tablas
)


@app.get("/")
def prueba():
    return {
        "prueba": "Servidor conectado"
    }


app.include_router(ER_ambientes.router)
app.include_router(ER_equipos.router)
app.include_router(roles.router)
app.include_router(asig_tec.router)
app.include_router(ticket.router)
app.include_router(Usuarios.asis)
app.include_router(His_tickets.asis)
app.include_router(estados_ticket.asis)