from typing import Optional
from sqlmodel import SQLModel, Field

class TipoEquipoBase(SQLModel):
    nombre_t: str

class TipoEquipo(TipoEquipoBase, table=True):
    __tablename__ = "tipo_equipo"

    id_tipo: int | None = Field(
        default=None,
        primary_key=True
    )

class TipoEquipoCrear(TipoEquipoBase):
    pass

class TipoEquipoEditar(SQLModel):
    nombre_t: Optional[str] = None