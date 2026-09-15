from Modelos.Usuarios import (UsuarioCrear, UsuarioEditar, Usuario, UsuarioLeer, UsuarioPreRegistro)
from fastapi import APIRouter, status, HTTPException
from conexion_db import Sesion_dependencia
from sqlmodel import select
from seguridad import encriptar_contrasena, crear_token_proposito
from correo import correo_activacion
from Modelos.roles import Rol
import secrets

asis = APIRouter(prefix="/usuarios", tags=["Usuarios"])


# ==========================================
# 1. LISTAR TODOS LOS USUARIOS
# ==========================================
@asis.get("/", response_model=list[UsuarioLeer])
async def listar_usuarios(sesion: Sesion_dependencia):
    lista_usu = sesion.exec(select(Usuario)).all()
    return lista_usu


# ==========================================
# 2. LISTAR SOLO TÉCNICOS (Ruta específica antes de /{id_usuario})
# ==========================================
@asis.get("/tecnicos", response_model=list[UsuarioLeer])
async def listar_solo_tecnicos(sesion: Sesion_dependencia):
    consulta = (select(Usuario).join(Rol, Usuario.id_rol == Rol.id_rol)
        .where(Rol.nombre_rol == "tecnico"))
    tecnicos = sesion.exec(consulta).all()
    return tecnicos


# ==========================================
# 3. OBTENER USUARIO POR ID
# ==========================================
@asis.get("/{id_usuario}", response_model=UsuarioLeer)
async def listar_usuario(id_usuario: int, mi_sesion: Sesion_dependencia):
    usuario = mi_sesion.get(Usuario, id_usuario)

    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )

    return usuario


# ==========================================
# 4. CREAR USUARIO (Registro directo)
# ==========================================
@asis.post("/", response_model=UsuarioLeer)
async def crear_usuario(datos_usuario: UsuarioCrear, mi_sesion: Sesion_dependencia):
    datos = datos_usuario.model_dump()
    
    # ENCRIPTAR CONTRASEÑA
    datos["contrasena_u"] = encriptar_contrasena(datos["contrasena_u"])

    # CREAR USUARIO
    nuevo_usuario = Usuario.model_validate(datos)

    mi_sesion.add(nuevo_usuario)
    mi_sesion.commit()
    mi_sesion.refresh(nuevo_usuario)
    return nuevo_usuario


# ==========================================
# 5. PRE-REGISTRO (RF-016) - Ruta específica
# ==========================================
@asis.post("/pre-registrar", response_model=UsuarioLeer)
async def pre_registrar_usuario(datos: UsuarioPreRegistro, mi_sesion: Sesion_dependencia):
    contrasena_temporal = encriptar_contrasena(secrets.token_urlsafe(24))

    nuevo_usuario = Usuario(
        **datos.model_dump(),
        contrasena_u=contrasena_temporal,
        activo=False
    )

    mi_sesion.add(nuevo_usuario)
    mi_sesion.commit()
    mi_sesion.refresh(nuevo_usuario)

    token = crear_token_proposito(nuevo_usuario.id_usuario, "activacion", minutos=60 * 24)
    correo_activacion(nuevo_usuario.correo_u, nuevo_usuario.nombre_u, token)

    return nuevo_usuario


# ==========================================
# 6. EDITAR USUARIO
# ==========================================
@asis.put("/{id_usuario}", response_model=UsuarioLeer)
async def editar_usuario(id_usuario: int, datos_usuario: UsuarioEditar, mi_sesion: Sesion_dependencia):
    usuario = mi_sesion.get(Usuario, id_usuario)

    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )

    usuario_dict = datos_usuario.model_dump(exclude_unset=True)

    # SI CAMBIÓ LA CONTRASEÑA
    if "contrasena_u" in usuario_dict:
        usuario_dict["contrasena_u"] = encriptar_contrasena(usuario_dict["contrasena_u"])

    usuario.sqlmodel_update(usuario_dict)
    mi_sesion.add(usuario)
    mi_sesion.commit()
    mi_sesion.refresh(usuario)
    return usuario


# ==========================================
# 7. ELIMINAR USUARIO
# ==========================================
@asis.delete("/{id_usuario}", response_model=UsuarioLeer)
async def eliminar_usuario(id_usuario: int, mi_sesion: Sesion_dependencia):
    usuario = mi_sesion.get(Usuario, id_usuario)

    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )

    usuario_eliminado = UsuarioLeer.model_validate(usuario)
    mi_sesion.delete(usuario)
    mi_sesion.commit()
    return usuario_eliminado