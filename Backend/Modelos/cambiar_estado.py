from sqlmodel import SQLModel


class CambioEstado(SQLModel):
    id_estado: int
    observacion: str | None = None