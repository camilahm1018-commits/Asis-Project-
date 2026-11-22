from Modelos.Usuarios import (UsuarioCrear, UsuarioEditar, Usuario, UsuarioLeer, UsuarioPreRegistro)
from fastapi import APIRouter, status, HTTPException, Depends
from conexion_db import Sesion_admin
from sesiones_roles import Sesion_por_rol
from sqlalchemy import delete, func
from sqlalchemy.exc import IntegrityError
from sqlmodel import select
from seguridad import encriptar_contrasena, crear_token_proposito, verificar_token, solo_admin, solo_gestion_tickets
from servicios.correo import correo_activacion
from Modelos.roles import Rol
from Modelos.tipo_documento import Tipo_identificacion
import secrets

asis = APIRouter(prefix="/usuarios", tags=["Usuarios"], dependencies=[Depends(verificar_token)])

def validar_datos_duplicados(sesion, correo=None, documento=None, id_excluir=None):
    correo_duplicado = False
    documento_duplicado = False

    if correo:
        consulta_correo = select(Usuario.id_usuario).where(
            func.lower(Usuario.correo_u) == correo.strip().lower()
        )

        if id_excluir is not None:
            consulta_correo = consulta_correo.where(
                Usuario.id_usuario != id_excluir
            )

        correo_duplicado = sesion.exec(consulta_correo).first() is not None

    if documento:
        consulta_documento = select(Usuario.id_usuario).where(
            Usuario.numero_documento == documento.strip()
        )

        if id_excluir is not None:
            consulta_documento = consulta_documento.where(
                Usuario.id_usuario != id_excluir
            )

        documento_duplicado = sesion.exec(consulta_documento).first() is not None

    if correo_duplicado and documento_duplicado:
        mensaje = "El correo electrónico y el número de documento ya están registrados."
    elif correo_duplicado:
        mensaje = "El correo electrónico ya se encuentra registrado."
    elif documento_duplicado:
        mensaje = "El número de documento ya se encuentra registrado."
    else:
        return

    raise HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail=mensaje
    )


def validar_catalogos(sesion, campos):
    if "id_rol" in campos and sesion.get(Rol, campos["id_rol"]) is None:
        raise HTTPException(status_code=422, detail="Selecciona un rol válido")
    if ("id_tipo_identificacion" in campos
            and sesion.get(Tipo_identificacion, campos["id_tipo_identificacion"]) is None):
        raise HTTPException(status_code=422, detail="Selecciona un tipo de documento válido")


def guardar_usuario(sesion, usuario):
    try:
        sesion.add(usuario)
        sesion.commit()
    except IntegrityError:
        sesion.rollback()
        raise HTTPException(status_code=409, detail="No se pudo guardar el usuario. Revisa si el correo o el documento ya existen.")
    sesion.refresh(usuario)


# ==========================================
# 1. LISTAR TODOS LOS USUARIOS
# ==========================================
@asis.get("/", response_model=list[UsuarioLeer], dependencies=[Depends(solo_admin)])
async def listar_usuarios(sesion: Sesion_admin):
    lista_usu = sesion.exec(select(Usuario)).all()
    return lista_usu


# ==========================================
# 2. LISTAR SOLO TÉCNICOS (Ruta específica antes de /{id_usuario})
# ==========================================
@asis.get("/tecnicos", dependencies=[Depends(solo_gestion_tickets)])
async def listar_solo_tecnicos(sesion: Sesion_por_rol):
    # Proyección mínima: mesa de ayuda no necesita documento ni contraseña.
    filas = sesion.exec(
        select(Usuario.id_usuario, Usuario.nombre_u, Usuario.apellidos_u,
               Usuario.correo_u, Usuario.activo)
        .join(Rol, Usuario.id_rol == Rol.id_rol)
        .where(Rol.nombre_rol == "tecnico")
    ).all()
    return [dict(id_usuario=i, nombre_u=n, apellidos_u=a, correo_u=c, activo=ac)
            for i, n, a, c, ac in filas]

@asis.get("/resumen")
async def resumen_usuarios(sesion: Sesion_por_rol):
    filas = sesion.exec(
        select(
            Usuario.id_usuario,
            Usuario.nombre_u,
            Usuario.apellidos_u
        )
    ).all()

    return [
        {
            "id_usuario": id_usuario,
            "nombre_u": nombre,
            "apellidos_u": apellidos
        }
        for id_usuario, nombre, apellidos in filas
    ]

@asis.get("/instructores")
async def listar_instructores(sesion: Sesion_por_rol):
    # Solo id y nombre, de instructores activos: para elegir a quién se presta un equipo.
    filas = sesion.exec(
        select(Usuario.id_usuario, Usuario.nombre_u, Usuario.apellidos_u)
        .join(Rol, Usuario.id_rol == Rol.id_rol)
        .where(Rol.nombre_rol == "instructor", Usuario.activo == True)  # noqa: E712
        .order_by(Usuario.apellidos_u, Usuario.nombre_u)
    ).all()
    return [
        {"id_usuario": i, "nombre_u": n, "apellidos_u": a}
        for i, n, a in filas
    ]

# ==========================================
# 3. OBTENER USUARIO POR ID
# ==========================================
@asis.get("/{id_usuario}", response_model=UsuarioLeer, dependencies=[Depends(solo_admin)])
async def listar_usuario(id_usuario: int, mi_sesion: Sesion_admin):
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
@asis.post("/", response_model=UsuarioLeer, dependencies=[Depends(solo_admin)])
async def crear_usuario(datos_usuario: UsuarioCrear, mi_sesion: Sesion_admin):

    validar_datos_duplicados(
        mi_sesion,
        datos_usuario.correo_u,
        datos_usuario.numero_documento
    )

    datos = datos_usuario.model_dump()
    validar_catalogos(mi_sesion, datos)

    # ENCRIPTAR CONTRASEÑA
    datos["contrasena_u"] = encriptar_contrasena(datos["contrasena_u"])

    # CREAR USUARIO
    nuevo_usuario = Usuario.model_validate(datos)

    guardar_usuario(mi_sesion, nuevo_usuario)
    return nuevo_usuario


# ==========================================
# 5. PRE-REGISTRO (RF-016) - Ruta específica
# ==========================================
@asis.post("/pre-registrar", response_model=UsuarioLeer, dependencies=[Depends(solo_admin)])
async def pre_registrar_usuario(datos: UsuarioPreRegistro, mi_sesion: Sesion_admin):

    validar_datos_duplicados(
        mi_sesion,
        datos.correo_u,
        datos.numero_documento
    )
    validar_catalogos(mi_sesion, datos.model_dump())
    contrasena_temporal = encriptar_contrasena(secrets.token_urlsafe(24))

    nuevo_usuario = Usuario(
        **datos.model_dump(),
        contrasena_u=contrasena_temporal,
        activo=False
    )

    guardar_usuario(mi_sesion, nuevo_usuario)

    token = crear_token_proposito(nuevo_usuario.id_usuario, "activacion", minutos=60 * 24)
    correo_activacion(nuevo_usuario.correo_u, nuevo_usuario.nombre_u, token)

    return nuevo_usuario


# ==========================================
# 6. EDITAR USUARIO
# ==========================================
@asis.put("/{id_usuario}", response_model=UsuarioLeer, dependencies=[Depends(solo_admin)])
async def editar_usuario(id_usuario: int, datos_usuario: UsuarioEditar, mi_sesion: Sesion_admin,
                         admin: dict = Depends(solo_admin)):
    usuario = mi_sesion.get(Usuario, id_usuario)

    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )

    usuario_dict = datos_usuario.model_dump(exclude_unset=True)
    if id_usuario == admin["id_usuario"] and usuario_dict.get("id_rol", usuario.id_rol) != usuario.id_rol:
        raise HTTPException(status_code=409, detail="No puedes cambiar el rol de tu propia cuenta")
    validar_catalogos(mi_sesion, usuario_dict)

    validar_datos_duplicados(
        mi_sesion,
        usuario_dict.get("correo_u"),
        usuario_dict.get("numero_documento"),
        id_excluir=id_usuario
    )

    # SI CAMBIÓ LA CONTRASEÑA
    if "contrasena_u" in usuario_dict:
        usuario_dict["contrasena_u"] = encriptar_contrasena(usuario_dict["contrasena_u"])

    usuario.sqlmodel_update(usuario_dict)
    guardar_usuario(mi_sesion, usuario)
    return usuario


# ==========================================
# 7. ELIMINAR USUARIO
# ==========================================
@asis.delete("/{id_usuario}", response_model=UsuarioLeer, dependencies=[Depends(solo_admin)])
async def eliminar_usuario(id_usuario: int, mi_sesion: Sesion_admin,
                           admin: dict = Depends(solo_admin)):
    if id_usuario == admin["id_usuario"]:
        raise HTTPException(status_code=409, detail="No puedes eliminar tu propia cuenta")
    usuario = mi_sesion.get(Usuario, id_usuario)

    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )

    usuario_eliminado = UsuarioLeer.model_validate(usuario)
    try:
        # Ejecutar DELETE directamente para que los vínculos no se desvinculen por el ORM.
        mi_sesion.exec(delete(Usuario).where(Usuario.id_usuario == id_usuario))
        mi_sesion.commit()
    except IntegrityError:
        mi_sesion.rollback()
        raise HTTPException(status_code=409, detail="No se puede eliminar el usuario porque tiene tickets, ambientes u otros registros vinculados.")
    return usuario_eliminado
