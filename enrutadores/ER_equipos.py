from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from conexion_db import get_session
from modelos.equipos import Equipo, EquipoCrear, EquipoEditar, EquipoLeer


router = APIRouter(
    prefix="/equipos",
    tags=["Equipos"]
)


# Crear equipo
@router.post("/", response_model=EquipoLeer)
def crear_equipo(
    equipo: EquipoCrear,
    session: Session = Depends(get_session)
):

    nuevo_equipo = Equipo.model_validate(equipo)

    session.add(nuevo_equipo)
    session.commit()
    session.refresh(nuevo_equipo)

    return nuevo_equipo



# Listar equipos
@router.get("/", response_model=list[EquipoLeer])
def listar_equipos(
    session: Session = Depends(get_session)
):

    equipos = session.exec(
        select(Equipo)
    ).all()

    return equipos



# Buscar equipo por serial
@router.get("/{serial}", response_model=EquipoLeer)
def obtener_equipo(
    serial: str,
    session: Session = Depends(get_session)
):

    equipo = session.get(Equipo, serial)

    if not equipo:
        raise HTTPException(
            status_code=404,
            detail="Equipo no encontrado"
        )

    return equipo



# Editar equipo
@router.put("/{serial}", response_model=EquipoLeer)
def editar_equipo(
    serial: str,
    datos: EquipoEditar,
    session: Session = Depends(get_session)
):

    equipo = session.get(Equipo, serial)

    if not equipo:
        raise HTTPException(
            status_code=404,
            detail="Equipo no encontrado"
        )


    datos_actualizados = datos.model_dump()

    for campo, valor in datos_actualizados.items():
        setattr(equipo, campo, valor)


    session.add(equipo)
    session.commit()
    session.refresh(equipo)

    return equipo



# Eliminar equipo
@router.delete("/{serial}")
def eliminar_equipo(
    serial: str,
    session: Session = Depends(get_session)
):

    equipo = session.get(Equipo, serial)

    if not equipo:
        raise HTTPException(
            status_code=404,
            detail="Equipo no encontrado"
        )


    session.delete(equipo)
    session.commit()

    return {
        "mensaje": "Equipo eliminado correctamente"
    }