from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
from typing import Optional
from sqlalchemy import text 

class TicketsBase(SQLModel):
    motivo: str 
    fecha_salida: Optional[datetime] = Field(default=None)
    fecha_retorno: Optional[datetime] = Field(default=None)
    
    # 2. Dejamos que Postgres asigne el CURRENT_TIMESTAMP automáticamente
    creado_en: Optional[datetime] = Field(
        default=None, 
        sa_column_kwargs={"server_default": text("CURRENT_TIMESTAMP")}
    )
    id_equipo: Optional[str] = Field(default=None)
    id_ambiente: Optional[int] = Field(default=None)
    creado_por: Optional[str] = Field(default=None)
    asignado_a: Optional[str] = Field(default=None)
    id_estado: int
    id_motivo_no_reparacion: Optional[int] = Field(default=None)
    
class tickets(TicketsBase, table=True):
    __tablename__: str = "tickets" # Aseguramos que busque la tabla en minúsculas
    
    # 3. El truco maestro: le indicamos a SQLModel que use el DEFAULT de Postgres
    id_ticket: Optional[str] = Field(
        default=None, 
        primary_key=True,
        sa_column_kwargs={"server_default": text("default")}
    )
    
class TicketsCrear(TicketsBase):
    pass

class TicketsEditar(TicketsBase):
    pass

class TicketsLeer(TicketsBase):
    id_ticket: int 
