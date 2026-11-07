from sqlmodel import SQLModel, Field, Relationship

class Tipo_identificacionBase(SQLModel):
    iniciales: str = Field(default=None)    
    nombre_tipo: str = Field(default=None)
    
class Tipo_identificacion(Tipo_identificacionBase, table=True):    
    id_tipo_id: int = Field(default=None, primary_key=True)
    __tablename__ = "tipo_identificacion"

    
class Tipo_identificacionCrear(Tipo_identificacionBase):
    pass

class Tipo_identificacionEditar(SQLModel):
    iniciales: str = Field(default=None)    
    nombre_tipo: str = Field(default=None)

class Tipo_identificacionLeer(Tipo_identificacionBase):
    id_tipo_id: int