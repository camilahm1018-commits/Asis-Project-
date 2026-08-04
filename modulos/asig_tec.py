from sqlmodel import SQLModel, Field
from datetime import datetime

class Asig_tecBase(SQLModel):
    fecha_asignacion: datetime = Field(default=None)
    id_tecnico: str = Field(default=None)
    id_ticket: str = Field(default=None)

class asignacion_tecnico(Asig_tecBase, table=True):
    id_asignacion: int = Field(default=None, primary_key=True)
    
class Asig_tecCrear(Asig_tecBase):
    pass
    
class Asig_tecEditar(Asig_tecBase):
    pass
    
class Asig_tecLeer(Asig_tecBase):
    id: int