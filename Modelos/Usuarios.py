from datetime import datetime
from typing import TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship


if TYPE_CHECKING:
    from Modelos.ambientes import Ambiente


class UsuarioBase(SQLModel):

    nombre_u: str

    apellidos_u: str

    correo_u: str

    contrasena_u: str

    tipo_documento: str

    numero_documento: str

    telefono_u: str | None = None

    creado_en: datetime = Field(
        default_factory=datetime.now
    )

    id_rol: int | None = Field(
        default=None,
        foreign_key="rol.id_rol"
    )



class UsuarioCrear(UsuarioBase):
    pass



class UsuarioEditar(SQLModel):

    nombre_u: str | None = None

    apellidos_u: str | None = None

    correo_u: str | None = None

    contrasena_u: str | None = None

    tipo_documento: str | None = None

    numero_documento: str | None = None

    telefono_u: str | None = None

    id_rol: int | None = None



class Usuario(UsuarioBase, table=True):

    __tablename__ = "usuarios"


    id_usuario: int | None = Field(
        default=None,
        primary_key=True
    )


    # Un cuentadante puede tener muchos ambientes
    ambientes: list["Ambiente"] = Relationship(
        back_populates="cuentadante"
    )



class UsuarioLeer(UsuarioBase):

    id_usuario: int