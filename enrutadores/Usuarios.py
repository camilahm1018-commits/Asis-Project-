from Modelos.Usuarios import (UsuarioCrear,UsuarioEditar,Usuario,UsuarioLeer)
from fastapi import APIRouter, status, HTTPException
from conexion_db import Sesion_dependencia
from sqlmodel import select
from seguridad import encriptar_contrasena
from Modelos.roles import Rol


asis = APIRouter(prefix="/usuarios",tags=["Usuarios"])

@asis.get("/", response_model=list[UsuarioLeer])
async def listar_usuarios(sesion: Sesion_dependencia):
    lista_usu = sesion.exec(select(Usuario)).all()
    return lista_usu


@asis.get("/usuarios/{id_usuario}",response_model=UsuarioLeer)
async def listar_usuario(id_usuario: int,mi_sesion: Sesion_dependencia):

    usuario = mi_sesion.get(Usuario,id_usuario)

    if not usuario:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Usuario no encontrado"
        )

    return usuario


@asis.post("/usuarios",response_model=UsuarioLeer)
async def crear_usuario(datos_usuario: UsuarioCrear,mi_sesion: Sesion_dependencia):
    usuario_existente = mi_sesion.exec(
        select(Usuario).where(
            Usuario.correo_u == datos_usuario.correo_u
        )
    ).first()

    if usuario_existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El correo ya está registrado"
        )

    datos = datos_usuario.model_dump()
    
    # --------------------------------------
    # ENCRIPTAR CONTRASEÑA
    # --------------------------------------

    datos["contrasena_u"] = encriptar_contrasena(datos["contrasena_u"])

    # --------------------------------------
    # CREAR USUARIO
    # --------------------------------------

    nuevo_usuario = Usuario.model_validate(datos)

    mi_sesion.add(nuevo_usuario)
    mi_sesion.commit()
    mi_sesion.refresh(nuevo_usuario)
    return nuevo_usuario




@asis.put("/usuarios/{id_usuario}",response_model=UsuarioLeer)
async def editar_usuario(id_usuario: int,datos_usuario: UsuarioEditar,mi_sesion: Sesion_dependencia):

    usuario = mi_sesion.get(Usuario,id_usuario)

    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Usuario no encontrado"
        )

    usuario_dict = datos_usuario.model_dump(exclude_unset=True)

    # --------------------------------------
    # SI CAMBIÓ LA CONTRASEÑA
    # --------------------------------------

    if "contrasena_u" in usuario_dict:
        usuario_dict["contrasena_u"] = (encriptar_contrasena(
                usuario_dict["contrasena_u"]
            )
        )

    usuario.sqlmodel_update(usuario_dict)
    mi_sesion.add(usuario)
    mi_sesion.commit()
    mi_sesion.refresh(usuario)
    return usuario


@asis.delete("/usuarios/{id_usuario}",response_model=UsuarioLeer)
async def eliminar_usuario(id_usuario: int,mi_sesion: Sesion_dependencia):

    usuario = mi_sesion.get(Usuario,id_usuario)

    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Usuario no encontrado"
        )

    usuario_eliminado = UsuarioLeer.model_validate(usuario)
    mi_sesion.delete(usuario)
    mi_sesion.commit()
    return usuario_eliminado


@asis.get("/tecnicos",response_model=list[UsuarioLeer])
async def listar_solo_tecnicos(sesion: Sesion_dependencia):

    consulta = (select(Usuario).join(Rol,Usuario.id_rol == Rol.id_rol)
        .where(Rol.nombre_rol == "tecnico"))

    tecnicos = sesion.exec(consulta).all()
    return tecnicos