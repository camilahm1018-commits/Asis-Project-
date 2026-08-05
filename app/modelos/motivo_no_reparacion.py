from typing import Optional
from sqlmodel import SQLModel, Field

class MotivoBase(SQLModel):
    nombre_motivo: str

class MotivoNoReparacion(MotivoBase, table=True):
    __tablename__ = "motivo_no_reparacion"

    id_motivo: Optional[int] = Field(
        default=None,
        primary_key=True
    )

class MotivoCrear(MotivoBase):
    pass

class MotivoEditar(SQLModel):
    nombre_motivo: Optional[str] = None