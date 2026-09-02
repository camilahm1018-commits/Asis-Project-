from pydantic import BaseModel
from datetime import datetime
from sqlmodel import SQLModel, Field, Relationship


class estados_ticketBase (SQLModel):
    #atributos
    nombre_e: str
    color: str
    
class estados_ticketCrear(estados_ticketBase):
    pass


class estados_ticketEditar(estados_ticketBase):
    pass

class estados_ticket(estados_ticketBase, table= True):
    __tablename__ = "estados_ticket"
    id_estado: int | None = Field(default=None, primary_key=True) 
    

    
class estados_ticketLeer (estados_ticketBase):
    id_estado: int