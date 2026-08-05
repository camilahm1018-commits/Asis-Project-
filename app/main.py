from fastapi import FastAPI
from sqlmodel import SQLModel

from app.conexion_bd import engine

from app.modelos.tipo_equipo import TipoEquipo
from app.modelos.motivo_no_reparacion import MotivoNoReparacion
from app.modelos.notificaciones import Notificacion

from app.rutas.tipo_equipo import ruta_tipo_equipo
from app.rutas.motivo_no_reparacion import ruta_tipo_motivo
from app.rutas.notificaciones import ruta_notificaciones

app = FastAPI(
    title="API Reparaciones"
)

SQLModel.metadata.create_all(engine)

app.include_router(ruta_tipo_equipo)
app.include_router(ruta_tipo_motivo)
app.include_router(ruta_notificaciones)