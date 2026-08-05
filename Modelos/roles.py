from sqlmodel import SQLModel, Field, Relationship

class RolBase(SQLModel):
    nombre_rol: str = Field(default=None)    

class Rol(RolBase, table=True):    
    id_rol: int = Field(default=None, primary_key=True)
    __tablename__ = "rol"

    
class RolCrear(RolBase):
    pass

class RolEditar(RolBase):
    pass

class RolLeer(RolBase):
    id_rol: int
