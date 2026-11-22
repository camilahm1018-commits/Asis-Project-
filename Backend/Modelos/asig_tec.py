from sqlmodel import SQLModel, Field
from datetime import datetime


class Asig_tecBase(SQLModel):
    id_ticket: int
    id_tecnico: int
    fecha_asignacion: datetime = Field(default_factory=datetime.now)
    asignado_por: int

class Asig_tecCrear(Asig_tecBase):
    pass


class Asig_tec(Asig_tecBase, table=True):
    __tablename__ = "asignacion_tecnico"

    id_asignacion: int | None = Field(
        default=None,
        primary_key=True
    )


class Asig_tecEditar(Asig_tecBase):
    pass


class Asig_tecLeer(Asig_tecBase):
    id_asignacion: int