from typing import Optional
from datetime import datetime

from sqlmodel import SQLModel, Field

class NotificacionBase(SQLModel):

    canal: str
    mensaje: str
    enviada: bool = False

    id_ticket: int
    id_usuario: int

class Notificacion(NotificacionBase, table=True):
    __tablename__ = "notificaciones"

    id_notificacion: Optional[int] = Field(
        default=None,
        primary_key=True
    )

    fecha_envio: datetime = Field(
        default_factory=datetime.now
    )

class NotificacionCrear(NotificacionBase):
    pass

class NotificacionEditar(SQLModel):

    canal: Optional[str] = None
    mensaje: Optional[str] = None
    enviada: Optional[bool] = None