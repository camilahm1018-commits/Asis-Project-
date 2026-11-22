from pydantic import BaseModel, ConfigDict


class AsignacionSchema(BaseModel):
    id_tecnico: int


class SolicitudAsignacion(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id_ticket: int
    id_tecnico: int