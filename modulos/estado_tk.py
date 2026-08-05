from sqlmodel import SQLModel, Field, Relationship
class EstadosticketsBase(SQLModel):
    nombre_e: str = Field(default=None)
    color: str = Field(default=None)
    
class estados_ticket(EstadosticketsBase, table=True):
    id: int = Field(default=None, primary_key=True)