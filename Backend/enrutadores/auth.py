from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from sqlmodel import Session, select
from conexion_db import motor_bd
from Modelos.Usuarios import Usuario
from Modelos.roles import Rol
from seguridad import (
    verificar_contrasena, crear_token, verificar_token,
    encriptar_contrasena, crear_token_proposito, verificar_token_proposito
)
from correo import correo_activacion, correo_recuperacion, correo_alerta_intento_no_valido

asis = APIRouter(prefix="/auth",tags=["Autenticación"])
# ==========================================
# LOGIN
# ==========================================

@asis.post("/login")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends()):

    with Session(motor_bd) as sesion:

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

    with Session(motor_bd) as sesion:

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

        return {
            "id_usuario": usuario.id_usuario,
            "nombre": usuario.nombre_u,
            "apellidos": usuario.apellidos_u,
            "correo": usuario.correo_u,
            "rol": rol.nombre_rol if rol else None
        }


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

    with Session(motor_bd) as sesion:

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

    id_usuario = verificar_token_proposito(datos.token, "activacion")

    with Session(motor_bd) as sesion:

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

    with Session(motor_bd) as sesion:

        usuario = sesion.exec(
            select(Usuario).where(Usuario.correo_u == datos.correo)
        ).first()

        if usuario and usuario.activo:
            token = crear_token_proposito(usuario.id_usuario, "recuperacion", minutos=30)
            
            # 🔍 AGREGADO: Imprimir el token en los logs para desarrollo
            print(f"\n{'='*60}")
            print(f" TOKEN DE RECUPERACIÓN GENERADO:")
            print(f"📧 Correo: {usuario.correo_u}")
            print(f"👤 Usuario: {usuario.nombre_u}")
            print(f"🎟️ Token: {token}")
            print(f"⏰ Válido por: 30 minutos")
            print(f"{'='*60}\n")
            
            # Intentar enviar correo (puede fallar si no hay SMTP configurado)
            try:
                correo_recuperacion(usuario.correo_u, usuario.nombre_u, token)
                print("✅ Correo enviado exitosamente")
            except Exception as e:
                print(f"⚠️ No se pudo enviar el correo: {e}")
                print("💡 Usa el token de arriba para probar manualmente")

        return {"mensaje": "Si el correo está registrado, te llegará un link para restablecer tu contraseña."}


class RestablecerContrasenaBody(BaseModel):
    token: str
    nueva_contrasena: str


@asis.post("/restablecer-contrasena")
async def restablecer_contrasena(datos: RestablecerContrasenaBody):

    id_usuario = verificar_token_proposito(datos.token, "recuperacion")

    with Session(motor_bd) as sesion:

        usuario = sesion.get(Usuario, id_usuario)

        if not usuario:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Usuario no encontrado")

        usuario.contrasena_u = encriptar_contrasena(datos.nueva_contrasena)

        sesion.add(usuario)
        sesion.commit()

        return {"mensaje": "Contraseña actualizada. Ya puedes iniciar sesión."}