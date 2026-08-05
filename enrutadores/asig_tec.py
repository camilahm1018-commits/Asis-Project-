from fastapi import APIRouter, HTTPException, status
from modulos.asig_tec import *
from conexion_bd import Sesion_dependencia
from sqlmodel import select

router = APIRouter(
    prefix="/asignacion",
    tags=["Asignacion Tecnico"]
)

@router.get("/", response_model=list[asignacion_tecnico])
async def listar_asig(session: Sesion_dependencia):
    list_asig = session.exec(select(asignacion_tecnico)).all()
    return list_asig

@router.get("/{id}", response_model=asignacion_tecnico)
async def listar_asig_id(id: int, session: Sesion_dependencia):
    asig_bd = session.get(asignacion_tecnico, id)
    if not asig_bd:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail= f"La asignacion con ID {id}, no existe.")
    return asig_bd

@router.post("/", response_model=asignacion_tecnico)
async def crear_asig(datos_asig: Asig_tecCrear, session: Sesion_dependencia):
    asig_validado= asignacion_tecnico.model_validate(datos_asig.model_dump())
    
    session.add(asig_validado)
    session.commit()
    session.refresh(asig_validado)
    return asig_validado

@router.patch("/{id}", response_model=asignacion_tecnico)
async def editar_asig(id: int,  datos_asig: Asig_tecEditar, session: Sesion_dependencia):
    asig_bd = session.get(asignacion_tecnico, id)
    if not asig_bd:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail= f"El Rol con ID {id}, no existe.")
    asig_dict = datos_asig.model_dump(exclude_unset=True)
    asig_bd.sqlmodel_update(asig_dict)
    session.add(asig_bd)
    session.commit()
    session.refresh(asig_bd)
    return asig_bd

@router.delete("/{id}", response_model= asignacion_tecnico)
async def eliminar_asig(id: int, session: Sesion_dependencia):
    asig_bd = session.get(asignacion_tecnico, id)
    
    if not asig_bd:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail= f"El Rol con ID {id}, no existe.")
    
    session.delete(asig_bd)
    session.commit()
    return asig_bd