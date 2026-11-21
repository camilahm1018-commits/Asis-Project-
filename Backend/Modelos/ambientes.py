from typing import Annotated, TYPE_CHECKING
from pydantic import Field as Regla, StringConstraints, field_validator
from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from Modelos.equipos import Equipo
    from Modelos.Usuarios import Usuario


NombreAmbiente = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)]


class AmbienteBase(SQLModel):

    nombre_a: NombreAmbiente
    ubicacion: NombreAmbiente
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

    id_ambiente: Annotated[int, Regla(ge=1)]
    capacidad_equipos: Annotated[int, Regla(ge=0)] | None = None

class AmbienteEditar(AmbienteBase):
    nombre_a: NombreAmbiente | None = None
    ubicacion: NombreAmbiente | None = None
    capacidad_equipos: Annotated[int, Regla(ge=0)] | None = None

    @field_validator("nombre_a", "ubicacion")
    @classmethod
    def no_admitir_nulos(cls, valor):
        if valor is None:
            raise ValueError("El campo no puede quedar vacío")
        return valor

class AmbienteLeer(AmbienteBase):

    id_ambiente: int