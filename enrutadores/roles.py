from fastapi import APIRouter, HTTPException, status
from Modelos.roles import Rol,RolCrear,RolEditar
from conexion_db import Sesion_dependencia
from sqlmodel import select

asis = APIRouter(
    prefix="/roles",
    tags=["Roles"]
)

@asis.get("/", response_model=list[Rol])
async def listar_roles(session: Sesion_dependencia):
    listRol = session.exec(select(Rol)).all()
    return listRol


@asis.get("/{id}", response_model=Rol)
async def listar_rol_id(id: int, session: Sesion_dependencia):
    rol_bd = session.get(Rol, id)
    if not rol_bd:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail= f"El Rol con ID {id}, no existe.")
    return rol_bd

@asis.post("/", response_model=Rol)
async def crear_rol(datos_rol: RolCrear, session: Sesion_dependencia):
    rol_validado = Rol.model_validate(
        datos_rol.model_dump()
    )
    
    session.add(rol_validado)
    session.commit()
    session.refresh(rol_validado)
    return rol_validado

@asis.patch("/{id}", response_model=Rol)
async def editar_rol(id: int, datos_rol: RolEditar, session: Sesion_dependencia):
    
    rol_bd = session.get(Rol, id)
    if not rol_bd:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail= f"El Rol con ID {id}, no existe.")
    rol_dict = datos_rol.model_dump(exclude_unset=True)
    rol_bd.sqlmodel_update(rol_dict)
    
    session.add(rol_bd)
    session.commit()
    session.refresh(rol_bd)
    return rol_bd

@asis.delete("/{id}", response_model=Rol)
async def eliminar_rol(id: int, session: Sesion_dependencia):
    rol_bd = session.get(Rol, id)
    
    if not rol_bd:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail= f"El Rol con ID {id}, no existe.")
    
    session.delete(rol_bd)
    session.commit()
    return rol_bd