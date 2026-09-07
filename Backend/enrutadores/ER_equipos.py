from fastapi import APIRouter, HTTPException, status
from sqlmodel import select

from conexion_db import Sesion_dependencia
from Modelos.equipos import Equipo,EquipoCrear,EquipoEditar,EquipoLeer
from fastapi import APIRouter, Query
from sqlmodel import select


asis = APIRouter(
    prefix="/equipos",
    tags=["Equipos"]
)


@asis.get("/", response_model=list[EquipoLeer])
async def listar_equipos(sesion: Sesion_dependencia):

    lista_equipos = sesion.exec(select(Equipo)).all()

    return lista_equipos


@asis.get("/{id_equipo}", response_model=EquipoLeer)
async def obtener_equipo(
    id_equipo: int,
    sesion: Sesion_dependencia
):

    equipo = sesion.get(Equipo, id_equipo)

    if not equipo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Equipo no encontrado"
        )

    return equipo


@asis.post("/", response_model=EquipoLeer)
async def crear_equipo(
    datos_equipo: EquipoCrear,
    sesion: Sesion_dependencia
):

    nuevo_equipo = Equipo.model_validate(datos_equipo)

    sesion.add(nuevo_equipo)
    sesion.commit()
    sesion.refresh(nuevo_equipo)

    return nuevo_equipo


@asis.put("/{id_equipo}", response_model=EquipoLeer)
async def editar_equipo(
    id_equipo: int,
    datos_equipo: EquipoEditar,
    sesion: Sesion_dependencia
):

    equipo = sesion.get(Equipo, id_equipo)

    if not equipo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Equipo no encontrado"
        )

    equipo_dict = datos_equipo.model_dump(exclude_unset=True)
    equipo.sqlmodel_update(equipo_dict)

    sesion.add(equipo)
    sesion.commit()
    sesion.refresh(equipo)

    return equipo


@asis.delete("/{id_equipo}", response_model=EquipoLeer)
async def eliminar_equipo(
    id_equipo: int,
    sesion: Sesion_dependencia
):

    equipo = sesion.get(Equipo, id_equipo)

    if not equipo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Equipo no encontrado"
        )

    equipo_eliminado = EquipoLeer.model_validate(equipo)

    sesion.delete(equipo)
    sesion.commit()

    return equipo_eliminado



# ... (tus otros endpoints de equipos) ...

@asis.get("/", response_model=list[EquipoLeer])
async def listar_equipos(
    sesion: Sesion_dependencia,  
    id_ambiente: int | None = Query(None, description="Filtrar por ambiente")  
):
    """Lista los equipos, filtrando por ambiente si se proporciona el parámetro"""
    if id_ambiente:
        query = select(Equipo).where(Equipo.id_ambiente == id_ambiente)
    else:
        query = select(Equipo)
    
    return sesion.exec(query).all()