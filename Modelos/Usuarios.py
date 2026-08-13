from datetime import datetime
from typing import TYPE_CHECKING, Optional
from sqlmodel import SQLModel, Field, Relationship


if TYPE_CHECKING:
    from Modelos.ambientes import Ambiente

class UsuarioBase(SQLModel):

    nombre_u: str
    apellidos_u: str
    correo_u: str
    contrasena_u: str
    numero_documento: str
    telefono_u: Optional[str] = None
    creado_en: datetime = Field(default_factory=datetime.now)
    id_rol: int | None = Field(default=None,foreign_key="rol.id_rol")
    id_tipo_identificacion: int = Field(foreign_key="tipo_identificacion.id_tipo_id")

class UsuarioCrear(UsuarioBase):
    pass



class UsuarioEditar(SQLModel):
    nombre_u: Optional[str] = None
    apellidos_u: Optional[str] = None
    correo_u: Optional[str] = None
    contrasena_u: Optional[str] = None
    numero_documento: Optional[str] = None
    telefono_u: Optional[str] = None
    id_rol: Optional[int] = None
    id_tipo_identificacion: Optional[int] = None


class Usuario(UsuarioBase, table=True):

    __tablename__ = "usuarios"
    id_usuario: int | None = Field(default=None,primary_key=True)
    ambientes: list["Ambiente"] = Relationship(back_populates="cuentadante")


class UsuarioLeer(UsuarioBase):

    id_usuario: int