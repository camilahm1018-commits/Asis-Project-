from fastapi import FastAPI
from sqlmodel import SQLModel

from conexion_bdpp import engine

from modelos.tipo_equipo import TipoEquipo
from modelos.motivo_no_reparacion import MotivoNoReparacion
from modelos.notificaciones import Notificacion

from enrutadores.tipo_equipo import ruta_tipo_equipo
from enrutadores.motivo_no_reparacion import ruta_tipo_motivo
from enrutadores.notificaciones import ruta_notificaciones

app = FastAPI(
    title="API Reparaciones"
)

SQLModel.metadata.create_all(engine)

app.include_router(ruta_tipo_equipo)
app.include_router(ruta_tipo_motivo)
app.include_router(ruta_notificaciones)