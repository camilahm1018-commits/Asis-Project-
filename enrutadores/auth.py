from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import select, Session
from conexion_db import motor_bd
from Modelos.Usuarios import Usuario
from Modelos.roles import Rol
from seguridad import verificar_contrasena, crear_token, verificar_token

asis = APIRouter(
    prefix="/auth",
    tags=["Autenticación"]
)


@asis.post("/login")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends()
):
    with Session(motor_bd) as sesion:
        usuario = sesion.exec(
            select(Usuario).where(Usuario.correo_u == form_data.username)
        ).first()

        if not usuario:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Correo o contraseña incorrectos"
            )

        if not verificar_contrasena(form_data.password, usuario.contrasena_u):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Correo o contraseña incorrectos"
            )

        rol = sesion.get(Rol, usuario.id_rol)

        token = crear_token({
            "id_usuario": usuario.id_usuario,
            "rol": rol.nombre_rol,
            "nombre": usuario.nombre_u,
            "correo": usuario.correo_u
        })

        return {
            "access_token": token,
            "token_type": "bearer",
            "id_usuario": usuario.id_usuario,
            "nombre": usuario.nombre_u,
            "apellidos": usuario.apellidos_u,
            "rol": rol.nombre_rol
        }


@asis.get("/yo")
async def mi_perfil(
    usuario_actual=Depends(verificar_token)
):
    with Session(motor_bd) as sesion:
        usuario = sesion.get(Usuario, usuario_actual["id_usuario"])
        rol = sesion.get(Rol, usuario.id_rol)
        return {
            "id_usuario": usuario.id_usuario,
            "nombre": usuario.nombre_u,
            "apellidos": usuario.apellidos_u,
            "correo": usuario.correo_u,
            "rol": rol.nombre_rol
        }