from sqlmodel import SQLModel, Field


class TipoMobiliario(SQLModel, table=True):
    __tablename__ = "tipo_mobiliario"

    id_tipo_mob: int | None = Field(default=None, primary_key=True)
    nombre_tm: str


class MobiliarioBase(SQLModel):
    codigo: str
    serial: str | None = None
    descripcion: str | None = None
    estado: str

    id_ambiente: int = Field(foreign_key="ambientes.id_ambiente")
    id_tipo_mob: int = Field(foreign_key="tipo_mobiliario.id_tipo_mob")


class Mobiliario(MobiliarioBase, table=True):
    __tablename__ = "mobiliario"

    id_mobiliario: int | None = Field(default=None, primary_key=True)


class MobiliarioLeer(MobiliarioBase):
    id_mobiliario: int
    nombre_tm: str  
    
class MobiliarioCrear(MobiliarioBase):
    pass


class MobiliarioEditar(SQLModel):
    codigo: str | None = None
    serial: str | None = None
    descripcion: str | None = None
    estado: str | None = None
    id_ambiente: int | None = None
    id_tipo_mob: int | None = None