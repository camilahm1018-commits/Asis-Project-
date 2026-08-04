from sqlmodel import SQLModel, Field, Relationship
from modelos.ambientes import Ambiente


class EquipoBase(SQLModel):
    serial: str = Field(primary_key=True)

    nombre: str = Field(default=None)
    marca: str = Field(default=None)
    descripcion: str = Field(default=None)
    estado: str = Field(default=None)

    id_ambiente: int = Field(
        default=None,
        foreign_key="ambiente.id_ambiente"
    )

    id_tipo: int = Field(default=None)


class Equipo(EquipoBase, table=True):

    ambiente: "Ambiente" = Relationship(
        back_populates="equipos"
    )


class EquipoCrear(EquipoBase):
    pass


class EquipoEditar(EquipoBase):
    pass


class EquipoLeer(EquipoBase):
    pass