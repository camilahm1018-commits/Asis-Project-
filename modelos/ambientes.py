from sqlmodel import SQLModel, Field, Relationship
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from modelos.equipos import Equipo


class AmbienteBase(SQLModel):
    nombre_am: str = Field(default=None)
    ubicacion: str = Field(default=None)
    capacidad: int = Field(default=None)
    estado: str = Field(default=None)
    descripcion: str = Field(default=None)


class Ambiente(AmbienteBase, table=True):

    id_ambiente: int = Field(
    primary_key=True)

    equipos: list["Equipo"] = Relationship(
        back_populates="ambiente"
    )


class AmbienteCrear(AmbienteBase):
    id_ambiente: int


class AmbienteEditar(AmbienteBase):
    pass


class AmbienteLeer(AmbienteBase):
    id_ambiente: int