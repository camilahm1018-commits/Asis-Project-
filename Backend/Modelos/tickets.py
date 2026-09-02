from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
from typing import Optional
from sqlalchemy import text 

class TicketsBase(SQLModel):
    motivo: str 
    fecha_salida: Optional[datetime] = Field(default=None)
    fecha_retorno: Optional[datetime] = Field(default=None)
    creado_en: Optional[datetime] = Field(default_factory=datetime.now)
    atendido: bool = False
    
    id_equipo: int = Field(default=None,foreign_key="equipos.id_equipo")
    creado_por: int = Field(foreign_key="usuarios.id_usuario")
    asignado_a: Optional[int] = Field(default=None, foreign_key="usuarios.id_usuario")
    id_estado: int = Field(foreign_key="estados_ticket.id_estado")
    id_motivo_novedad: Optional[int] = Field(default=None, foreign_key="motivo_novedad.id_motivo")
    
class tickets(TicketsBase, table=True):
    __tablename__: str = "tickets" 
    
    
    id_ticket: Optional[int] = Field(default=None, primary_key=True)
    
class TicketsCrear(TicketsBase):
    pass

class TicketsEditar(SQLModel):
    motivo: Optional[str] = None
    fecha_salida: Optional[datetime] = None
    fecha_retorno: Optional[datetime] = None
    atendido: Optional[bool] = None
    id_equipo: Optional[int] = None
    creado_por: Optional[int] = None
    asignado_a: Optional[int] = None
    id_estado: Optional[int] = None
    id_motivo_novedad: Optional[int] = None

class TicketsLeer(TicketsBase):
    id_ticket: int 
