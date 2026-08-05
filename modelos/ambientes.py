from typing import TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from Modelos.equipos import Equipo
    from Modelos.usuarios import Usuario


class AmbienteBase(SQLModel):

    nombre_a: str

    ubicacion: str

    capacidad: int | None = None

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



class AmbienteEditar(SQLModel):

    nombre_a: str | None = None

    ubicacion: str | None = None

    capacidad: int | None = None

    estado: str | None = None

    descripcion: str | None = None

    id_cuentadante: int | None = None



class AmbienteLeer(AmbienteBase):

    id_ambiente: int