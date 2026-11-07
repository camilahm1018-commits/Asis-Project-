from pydantic import BaseModel
from datetime import datetime
from sqlmodel import SQLModel, Field, Relationship
from typing import Optional
from Modelos.Usuarios import Usuario, UsuarioLeer

class His_ticketBase (SQLModel):
    accion: str
    observacion: Optional[str] = None
    fecha: datetime = Field(default_factory=datetime.now)
    estado_resultante: str
    id_ticket: int = Field(foreign_key="tickets.id_ticket")
    id_usuario: int = Field(foreign_key="usuarios.id_usuario")
    
class His_ticketCrear(His_ticketBase):
    pass

class His_ticketEditar(SQLModel):
    accion: Optional[str] = None
    observacion: Optional[str] = None
    estado_resultante: Optional[str] = None

class His_ticket(His_ticketBase, table= True):
    __tablename__ = "historial_tickets"
    id_historial: int | None = Field(default=None, primary_key=True) 
    

    
class His_ticketLeer (His_ticketBase):
    id_historial: int
    