from pydantic import BaseModel
from datetime import datetime
from sqlmodel import SQLModel, Field, Relationship
from modelos.Usuarios import Usuario, UsuarioLeer

class His_ticketBase (SQLModel):
    #atributos
    accion: str
    observacion: str
    fecha: datetime = Field(default_factory=datetime.now)
    estado_resultante: str
    id_ticket: int | None = Field(default=None)
    id_usuario: int | None = Field(default=None, foreign_key="usuarios.id_usuario")
    
class His_ticketCrear(His_ticketBase):
    pass

class His_ticketEditar(His_ticketBase):
    pass

class His_ticket(His_ticketBase, table= True):
    __tablename__ = "historial_tickets"
    id_historial: int | None = Field(default=None, primary_key=True) 
    

    
class His_ticketLeer (His_ticketBase):
    id_historial: int
    