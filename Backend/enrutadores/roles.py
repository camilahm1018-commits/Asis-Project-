from fastapi import APIRouter, HTTPException, status, Depends
from Modelos.roles import Rol,RolCrear,RolEditar
from conexion_db import Sesion_admin
from sesiones_roles import Sesion_por_rol
from sqlmodel import select
from seguridad import verificar_token, solo_admin

asis = APIRouter(
    prefix="/roles",
    tags=["Roles"], dependencies=[Depends(verificar_token)]
)

#Leer todos los roles
@asis.get("/", response_model=list[Rol])
async def listar_roles(session: Sesion_por_rol):
    listRol = session.exec(select(Rol)).all()
    return listRol

#Leer un rol por ID
@asis.get("/{id}", response_model=Rol)
async def listar_rol_id(id: int, session: Sesion_por_rol):
    rol_bd = session.get(Rol, id)
    if not rol_bd:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail= f"El Rol con ID {id}, no existe.")
    return rol_bd

#Crear un rol
@asis.post("/", response_model=Rol, dependencies=[Depends(solo_admin)])
async def crear_rol(datos_rol: RolCrear, session: Sesion_admin):
    rol_validado = Rol.model_validate(
        datos_rol.model_dump()
    )
    
    session.add(rol_validado)
    session.commit()
    session.refresh(rol_validado)
    return rol_validado

#editar un rol
@asis.put("/{id}", response_model=Rol, dependencies=[Depends(solo_admin)])
async def editar_rol(id: int, datos_rol: RolEditar, session: Sesion_admin):
    
    rol_bd = session.get(Rol, id)
    if not rol_bd:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail= f"El Rol con ID {id}, no existe.")
    rol_dict = datos_rol.model_dump(exclude_unset=True)
    rol_bd.sqlmodel_update(rol_dict)
    
    session.add(rol_bd)
    session.commit()
    session.refresh(rol_bd)
    return rol_bd

#eliminar un rol
@asis.delete("/{id}", response_model=Rol, dependencies=[Depends(solo_admin)])
async def eliminar_rol(id: int, session: Sesion_admin):
    rol_bd = session.get(Rol, id)
    
    if not rol_bd:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail= f"El Rol con ID {id}, no existe.")
    
    session.delete(rol_bd)
    session.commit()
    return rol_bd