
from typing import TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from modelos.equipos import Equipo


class AmbienteBase(SQLModel):
    nombre_a: str
    numero: str
    ubicacion: str
    capacidad: int | None = None
    estado: str = "activo"
    descripcion: str | None = None


class Ambiente(AmbienteBase, table=True):
    __tablename__ = "ambientes"

    id_ambiente: int | None = Field(default=None, primary_key=True)

    equipos: list["Equipo"] = Relationship(
        back_populates="ambiente"
    )


class AmbienteCrear(AmbienteBase):
    pass


class AmbienteEditar(SQLModel):
    nombre_a: str | None = None
    numero: str | None = None
    ubicacion: str | None = None
    capacidad: int | None = None
    estado: str | None = None
    descripcion: str | None = None


class AmbienteLeer(AmbienteBase):
    id_ambiente: int