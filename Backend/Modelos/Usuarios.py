from datetime import datetime
from typing import Annotated, TYPE_CHECKING, Optional
from pydantic import Field as Regla, StringConstraints, field_validator
from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:from Modelos.ambientes import Ambiente

Nombre = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=50)]
Apellidos = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)]
Correo = Annotated[str, StringConstraints(strip_whitespace=True, to_lower=True, max_length=100,
    pattern=r"(?i)^[A-Za-z0-9._%+-]+@(?:sena\.edu\.co|soy\.sena\.edu\.co|gmail\.com)$")]
Documento = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=20)]
Telefono = Annotated[str, StringConstraints(strip_whitespace=True, max_length=20)]
IdPositivo = Annotated[int, Regla(gt=0)]


class UsuarioBase(SQLModel):

    nombre_u: str
    apellidos_u: str
    correo_u: str
    contrasena_u: str
    numero_documento: str
    telefono_u: Optional[str] = None
    creado_en: datetime = Field(default_factory=datetime.now)
    activo: bool = Field(default=True)
    id_rol: int | None = Field(default=None,foreign_key="rol.id_rol")
    id_tipo_identificacion: int = Field(foreign_key="tipo_identificacion.id_tipo_id")

class UsuarioCrear(UsuarioBase):
    nombre_u: Nombre
    apellidos_u: Apellidos
    correo_u: Correo
    numero_documento: Documento
    telefono_u: Telefono | None = None
    id_rol: IdPositivo
    id_tipo_identificacion: IdPositivo


class UsuarioPreRegistro(SQLModel):
    nombre_u: Nombre
    apellidos_u: Apellidos
    correo_u: Correo
    numero_documento: Documento
    telefono_u: Telefono | None = None
    id_rol: IdPositivo
    id_tipo_identificacion: IdPositivo


class UsuarioEditar(SQLModel):
    nombre_u: Nombre | None = None
    apellidos_u: Apellidos | None = None
    correo_u: Correo | None = None
    contrasena_u: str | None = None
    numero_documento: Documento | None = None
    telefono_u: Telefono | None = None
    id_rol: IdPositivo | None = None
    id_tipo_identificacion: IdPositivo | None = None

    @field_validator("nombre_u", "apellidos_u", "correo_u", "contrasena_u",
                     "numero_documento", "id_rol", "id_tipo_identificacion")
    @classmethod
    def rechazar_nulos_explicitos(cls, valor):
        if valor is None:
            raise ValueError("El campo no puede quedar vacío")
        return valor


class Usuario(UsuarioBase, table=True):

    __tablename__ = "usuarios"

    id_usuario: int | None = Field(default=None,primary_key=True)

    ambientes: list["Ambiente"] = Relationship(back_populates="cuentadante")


# ==========================================
# MODELO PARA MOSTRAR USUARIOS
# ==========================================
#
# IMPORTANTE:
# NO incluimos contrasena_u.
#
# Así la contraseña nunca se devuelve
# en los GET, DELETE, etc.
#

class UsuarioLeer(SQLModel):

    id_usuario: int
    nombre_u: str
    apellidos_u: str
    correo_u: str
    numero_documento: str
    telefono_u: Optional[str] = None
    creado_en: datetime
    id_rol: int | None = None
    id_tipo_identificacion: int
    activo: bool | None = None
