from typing import TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from Modelos.equipos import Equipo
    from Modelos.Usuarios import Usuario


class AmbienteBase(SQLModel):

    nombre_a: str
    ubicacion: str
    capacidad_equipos: int | None = None
    estado: str = "activo"
    descripcion: str | None = None
    id_cuentadante: int | None = Field(
        default=None,
        foreign_key="usuarios.id_usuario"
    )


class Ambiente(AmbienteBase, table=True):

    __tablename__ = "ambientes"


    # ID manual (205,100,1...)
    id_ambiente: int = Field(
        primary_key=True
    )

    equipos: list["Equipo"] = Relationship(
        back_populates="ambiente"
    )

    # Un ambiente pertenece a un cuentadante
    cuentadante: "Usuario" = Relationship(
        back_populates="ambientes"
    )

class AmbienteCrear(AmbienteBase):

    id_ambiente: int

class AmbienteEditar(AmbienteBase):
    pass

class AmbienteLeer(AmbienteBase):

    id_ambiente: int