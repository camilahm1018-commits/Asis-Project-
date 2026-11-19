import os
import re
import httpx
import traceback  
from typing import Optional
from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from sqlmodel import Session, select
from conexion_db import motor_auth
from Modelos.Usuarios import Usuario
from Modelos.roles import Rol
from Modelos.tipo_documento import Tipo_identificacion
from seguridad import (
    verificar_contrasena, crear_token, verificar_token,
    encriptar_contrasena, crear_token_proposito, verificar_token_proposito
)
from servicios.correo import correo_activacion, correo_recuperacion, correo_alerta_intento_no_valido, correo_cambio_contrasena
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

asis = APIRouter(prefix="/auth",tags=["Autenticación"])
# ==========================================
# LOGIN
# ==========================================

@asis.post("/login")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends()):

    with Session(motor_auth) as sesion:

        usuario = sesion.exec(select(Usuario).where(Usuario.correo_u == form_data.username)).first()

        if not usuario:

            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Correo o contraseña incorrectos"
            )

        # ----------------------------------
        # VERIFICAR CONTRASEÑA
        # ----------------------------------

        if not verificar_contrasena(
            form_data.password,
            usuario.contrasena_u
        ):

            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Correo o contraseña incorrectos"
            )

        # ----------------------------------
        # LA CUENTA DEBE ESTAR ACTIVADA (RF-016 / RF-017)
        # ----------------------------------

        if not usuario.activo:

            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Tu cuenta todavía no está activada. Revisa tu correo institucional."
            )

        # ----------------------------------
        # OBTENER ROL
        # ----------------------------------

        rol = sesion.get(Rol,usuario.id_rol)

        if not rol:

            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="El usuario no tiene un rol válido"
            )

        # ----------------------------------
        # CREAR TOKEN
        # ----------------------------------

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

# ==========================================
# PERFIL DEL USUARIO ACTUAL
# ==========================================

@asis.get("/yo")
async def mi_perfil(
    usuario_actual=Depends(verificar_token)):

    with Session(motor_auth) as sesion:

        usuario = sesion.get(
            Usuario,
            usuario_actual["id_usuario"]
        )

        if not usuario:

            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado"
            )

        rol = sesion.get(Rol,usuario.id_rol)
        tipo_id = sesion.get(Tipo_identificacion,usuario.id_tipo_identificacion)

        return {
            "id_usuario": usuario.id_usuario,
            "nombre": usuario.nombre_u,
            "apellidos": usuario.apellidos_u,
            "correo": usuario.correo_u,
            "rol": rol.nombre_rol if rol else None,
            "numero_documento": usuario.numero_documento,
            "tipo_documento": tipo_id.iniciales if tipo_id else None,
            "telefono": usuario.telefono_u,
            "creado_en": usuario.creado_en.isoformat() if usuario.creado_en else None
        }


# ==========================================
# EDITAR MI PERFIL
# ==========================================
# El usuario solo puede cambiar sus datos de contacto (nombre, apellidos
# y teléfono). El correo, el documento y el rol no se tocan acá: el correo
# es el que usa para iniciar sesión y recuperar la contraseña, y esos
# datos los gestiona el administrador desde /usuarios.

class ActualizarPerfilBody(BaseModel):
    nombre: Optional[str] = None
    apellidos: Optional[str] = None
    telefono: Optional[str] = None


@asis.put("/yo")
async def actualizar_mi_perfil(
    datos: ActualizarPerfilBody,
    usuario_actual=Depends(verificar_token)):

    cambios = datos.model_dump(exclude_unset=True)

    # ----------------------------------
    # VALIDACIONES (largos según la tabla usuarios)
    # ----------------------------------

    if "nombre" in cambios:
        cambios["nombre"] = (cambios["nombre"] or "").strip()
        if not cambios["nombre"]:
            raise HTTPException(status_code=400, detail="El nombre es obligatorio")
        if len(cambios["nombre"]) > 50:
            raise HTTPException(status_code=400, detail="El nombre no puede tener más de 50 caracteres")

    if "apellidos" in cambios:
        cambios["apellidos"] = (cambios["apellidos"] or "").strip()
        if not cambios["apellidos"]:
            raise HTTPException(status_code=400, detail="Los apellidos son obligatorios")
        if len(cambios["apellidos"]) > 100:
            raise HTTPException(status_code=400, detail="Los apellidos no pueden tener más de 100 caracteres")

    if "telefono" in cambios:
        telefono = re.sub(r"[\s-]", "", cambios["telefono"] or "")
        if telefono and not re.fullmatch(r"\+?\d{7,15}", telefono):
            raise HTTPException(
                status_code=400,
                detail="El teléfono debe tener entre 7 y 15 dígitos"
            )
        # vacío = el usuario quiere borrar el teléfono
        cambios["telefono"] = telefono or None

    with Session(motor_auth) as sesion:

        usuario = sesion.get(Usuario, usuario_actual["id_usuario"])

        if not usuario:

            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado"
            )

        if "nombre" in cambios:
            usuario.nombre_u = cambios["nombre"]
        if "apellidos" in cambios:
            usuario.apellidos_u = cambios["apellidos"]
        if "telefono" in cambios:
            usuario.telefono_u = cambios["telefono"]

        sesion.add(usuario)
        sesion.commit()

    # devuelvo el perfil ya actualizado, con la misma forma que GET /auth/yo
    return await mi_perfil(usuario_actual)


# ==========================================
# RF-016: CONFIRMACIÓN DE DATOS Y ACTIVACIÓN
# ==========================================
# El administrador ya dejó pre-registrado al usuario (con activo=False
# y sin contraseña usable) desde /usuarios/pre-registrar. Acá el
# usuario confirma que esos datos son suyos y, si coinciden, le mando
# el link para que cree su contraseña.

class ConfirmarDatosBody(BaseModel):
    numero_documento: str
    nombres: str
    apellidos: str
    correo: str


MENSAJE_CONFIRMACION_GENERICO = (
    "Si tus datos coinciden con un pre-registro pendiente, te llegará un "
    "correo con el link de activación."
)


@asis.post("/confirmar-datos")
async def confirmar_datos(datos: ConfirmarDatosBody):

    with Session(motor_auth) as sesion:

        usuario = sesion.exec(
            select(Usuario).where(Usuario.numero_documento == datos.numero_documento)
        ).first()

        coincide = (
            usuario is not None
            and not usuario.activo
            and usuario.nombre_u.strip().lower() == datos.nombres.strip().lower()
            and usuario.apellidos_u.strip().lower() == datos.apellidos.strip().lower()
            and usuario.correo_u.strip().lower() == datos.correo.strip().lower()
        )

        if coincide:

            token = crear_token_proposito(usuario.id_usuario, "activacion", minutos=60 * 24)
            correo_activacion(usuario.correo_u, usuario.nombre_u, token)

        else:

            # no le digo al usuario cuál fue el problema, para no
            # filtrar si un documento existe o no en el sistema
            administradores = sesion.exec(
                select(Usuario)
                .join(Rol, Usuario.id_rol == Rol.id_rol)
                .where(Rol.nombre_rol == "administrador")
            ).all()

            for admin in administradores:
                correo_alerta_intento_no_valido(admin.correo_u, datos.model_dump())

        # mismo mensaje en los dos casos, a propósito
        return {"mensaje": MENSAJE_CONFIRMACION_GENERICO}


class ActivarCuentaBody(BaseModel):
    token: str
    nueva_contrasena: str


@asis.post("/activar-cuenta")
async def activar_cuenta(datos: ActivarCuentaBody):

    if len(datos.nueva_contrasena) < 12:
        raise HTTPException(status_code=400, detail="Usa una contraseña de al menos 12 caracteres")

    id_usuario = verificar_token_proposito(datos.token, "activacion")

    with Session(motor_auth) as sesion:

        usuario = sesion.get(Usuario, id_usuario)

        if not usuario:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Usuario no encontrado")

        usuario.contrasena_u = encriptar_contrasena(datos.nueva_contrasena)
        usuario.activo = True

        sesion.add(usuario)
        sesion.commit()

        return {"mensaje": "Cuenta activada. Ya puedes iniciar sesión."}


# ==========================================
# RF-018: RECUPERAR CONTRASEÑA
# ==========================================

class SolicitarRecuperacionBody(BaseModel):
    correo: str


@asis.post("/solicitar-recuperacion")
async def solicitar_recuperacion(datos: SolicitarRecuperacionBody):

    with Session(motor_auth) as sesion:

        usuario = sesion.exec(
            select(Usuario).where(Usuario.correo_u == datos.correo)
        ).first()

        if usuario and usuario.activo:
            token = crear_token_proposito(usuario.id_usuario, "recuperacion", minutos=30)
            
            # Intentar enviar correo (puede fallar si no hay SMTP configurado)
            try:
                correo_recuperacion(usuario.correo_u, usuario.nombre_u, token)
                print("✅ Correo enviado exitosamente")
            except Exception as e:
                print(f"⚠️ No se pudo enviar el correo: {e}")

        return {"mensaje": "Si el correo está registrado, te llegará un link para restablecer tu contraseña."}


class RestablecerContrasenaBody(BaseModel):
    token: str
    nueva_contrasena: str


@asis.post("/restablecer-contrasena")
async def restablecer_contrasena(datos: RestablecerContrasenaBody):

    if len(datos.nueva_contrasena) < 12:
        raise HTTPException(status_code=400, detail="Usa una contraseña de al menos 12 caracteres")

    id_usuario = verificar_token_proposito(datos.token, "recuperacion")

    with Session(motor_auth) as sesion:

        usuario = sesion.get(Usuario, id_usuario)

        if not usuario:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Usuario no encontrado")

        usuario.contrasena_u = encriptar_contrasena(datos.nueva_contrasena)

        sesion.add(usuario)
        sesion.commit()

        return {"mensaje": "Contraseña actualizada. Ya puedes iniciar sesión."}
    
# ==========================================
# CAMBIAR CONTRASEÑA DESDE MI PERFIL (con envío al correo)
# ==========================================
# El usuario ya inició sesión, así que no le pido el correo: le mando el
# link al correo de su cuenta. El link lleva a la misma pantalla de
# /restablecer-contrasena que usa RF-018, con el mismo token de propósito.

def _enmascarar_correo(correo: str) -> str:
    usuario, _, dominio = correo.partition("@")
    return f"{usuario[:2]}{'*' * max(len(usuario) - 2, 1)}@{dominio}"


@asis.post("/solicitar-cambio-contrasena")
async def solicitar_cambio_contrasena(usuario_actual=Depends(verificar_token)):

    with Session(motor_auth) as sesion:

        usuario = sesion.get(Usuario, usuario_actual["id_usuario"])

        if not usuario:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")

        token = crear_token_proposito(usuario.id_usuario, "recuperacion", minutos=30)

        try:
            correo_cambio_contrasena(usuario.correo_u, usuario.nombre_u, token)
        except Exception as e:
            print(f"⚠️ No se pudo enviar el correo de cambio de contraseña: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="No se pudo enviar el correo. Inténtalo de nuevo en unos minutos."
            )

        return {
            "mensaje": (
                f"Te enviamos un correo a {_enmascarar_correo(usuario.correo_u)} con el enlace "
                "para cambiar tu contraseña. El enlace vence en 30 minutos."
            )
        }


# ==========================================
# iniciar sesion con Goggle
# ==========================================
    


@asis.post("/google-login")
async def google_login(datos: dict):
    try:
        access_token = datos.get("credential")
        if not access_token:
            raise HTTPException(status_code=400, detail="No se proporcionó credencial")

        # 1. CONSULTAR A GOOGLE
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://www.googleapis.com/oauth2/v2/userinfo",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=400, detail="Token de Google inválido")
            
            user_info = response.json()
            correo_google = user_info.get('email')
            
            if not correo_google:
                raise HTTPException(status_code=400, detail="No se pudo obtener el correo de Google")

        # 2. BUSCAR EN LA BASE DE DATOS
        with Session(motor_auth) as sesion:
            usuario = sesion.exec(select(Usuario).where(Usuario.correo_u == correo_google)).first()

            if not usuario:
                raise HTTPException(
                    status_code=403, 
                    detail="Tu correo no está registrado en el sistema ASIS. Contacta al administrador."
                )

            if not usuario.activo:
                raise HTTPException(
                    status_code=403, 
                    detail="Tu cuenta existe pero aún no está activada."
                )

            rol = sesion.get(Rol, usuario.id_rol)

            token = crear_token({
                "id_usuario": usuario.id_usuario,
                "rol": rol.nombre_rol if rol else "sin_rol",
                "nombre": usuario.nombre_u,
                "correo": usuario.correo_u
            })

            return {
                "access_token": token,
                "token_type": "bearer",
                "id_usuario": usuario.id_usuario,
                "nombre": usuario.nombre_u,
                "apellidos": usuario.apellidos_u,
                "rol": rol.nombre_rol if rol else "sin_rol"
            }
            
    except HTTPException:
        raise
    except Exception as e:
        print("========================================")
        print("ERROR CRÍTICO EN LOGIN GOOGLE (TRACEBACK COMPLETO):")
        traceback.print_exc()  # <-- ESTO IMPRIMIRÁ EL ERROR REAL EN LOS LOGS
        print("========================================")
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")