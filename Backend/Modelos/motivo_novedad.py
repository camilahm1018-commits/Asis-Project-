from typing import Optional
from sqlmodel import SQLModel, Field

class MotivoBase(SQLModel):
    nombre_novedad: str

class MotivoNovedad(MotivoBase, table=True):
    __tablename__ = "motivo_novedad"

    id_motivo: Optional[int] = Field(
        default=None,
        primary_key=True
    )

class MotivoCrear(MotivoBase):
    pass

class MotivoEditar(MotivoBase):
    pass