from pydantic import BaseModel
from datetime import datetime
from sqlmodel import SQLModel, Field, Relationship

class UsuarioBase (SQLModel):
    #atributos
    nombre_u: str = Field(default=None)
    apellidos_u: str = Field(default=None)
    correo_u: str = Field(default=None)
    contrasena_u: str = Field(default=None)
    tipo_documento: str = Field(default=None)
    numero_documento: int = Field(default=None)
    telefono_u: int = Field(default=None)
    creado_en: datetime = Field(default_factory=datetime.now)
    id_rol: int | None = Field(default=None)

class UsuarioCrear(UsuarioBase):
    pass

class UsuarioEditar(UsuarioBase):
    pass


class Usuario(UsuarioBase, table= True):
    __tablename__ = "usuarios"
    id_usuario : int | None = Field(default=None, primary_key=True) 
    
    
class UsuarioLeer (UsuarioBase):
    id_usuario: int