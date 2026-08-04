from fastapi import FastAPI
from conexion_bd import crear_tablas
from enrutadores import roles, asig_tec, ticket
app = FastAPI(lifespan=crear_tablas)

@app.get("/")
def prueba():
    return {"prueba" : "Servidor conectado"}

app.include_router(roles.router)
app.include_router(asig_tec.router)
app.include_router(ticket.router)