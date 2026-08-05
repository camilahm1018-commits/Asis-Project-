from typing import TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from Modelos.ambientes import Ambiente


class EquipoBase(SQLModel):
    codigo: str
    nombre: str
    marca: str | None = None
    serial: str | None = None
    descripcion: str | None = None
    estado: str

    id_ambiente: int = Field(
        foreign_key="ambientes.id_ambiente"
    )

    id_tipo: int = Field(
        foreign_key="tipo_equipo.id_tipo"
    )


class Equipo(EquipoBase, table=True):
    __tablename__ = "equipos"

    id_equipo: int | None = Field(
        default=None,
        primary_key=True
    )

    ambiente: "Ambiente" = Relationship(
        back_populates="equipos"
    )


class EquipoCrear(EquipoBase):
    pass


class EquipoEditar(SQLModel):
    codigo: str | None = None
    nombre: str | None = None
    marca: str | None = None
    serial: str | None = None
    descripcion: str | None = None
    estado: str | None = None
    id_ambiente: int | None = None
    id_tipo: int | None = None


class EquipoLeer(EquipoBase):
    id_equipo: int