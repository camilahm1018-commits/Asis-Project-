import os
from sqlmodel import Session
from conexion_db import motor_auth
from Modelos.Usuarios import Usuario
from Modelos.roles import Rol
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer


# ==========================================
# CONFIGURACIÓN DEL TOKEN
# ==========================================

CLAVE_SECRETA = os.environ.get("ASIS_JWT_SECRET", "")
if len(CLAVE_SECRETA) < 32:
    raise RuntimeError("Configura ASIS_JWT_SECRET con al menos 32 caracteres en el archivo .env")
ALGORITMO = "HS256"
MINUTOS_EXPIRACION = 480  # 8 horas


# ==========================================
# CONFIGURACIÓN DE CONTRASEÑAS
# ==========================================

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)


# ==========================================
# AUTENTICACIÓN OAUTH2
# ==========================================

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/auth/login"
)


# ==========================================
# CONTRASEÑAS
# ==========================================

def encriptar_contrasena(contrasena: str) -> str:
    """
    Convierte una contraseña en texto plano
    a un hash bcrypt.
    """
    return pwd_context.hash(contrasena)


def verificar_contrasena(
    contrasena_plana: str,
    contrasena_hash: str
) -> bool:
    """
    Compara la contraseña escrita por el usuario
    con el hash almacenado en la base de datos.
    """
    return pwd_context.verify(
        contrasena_plana,
        contrasena_hash
    )


# ==========================================
# CREAR TOKEN JWT
# ==========================================

def crear_token(datos: dict) -> str:

    datos_token = datos.copy()

    expiracion = datetime.utcnow() + timedelta(
        minutes=MINUTOS_EXPIRACION
    )

    datos_token.update({
        "exp": expiracion,
        "tipo": "acceso"
    })

    return jwt.encode(
        datos_token,
        CLAVE_SECRETA,
        algorithm=ALGORITMO
    )


# ==========================================
# VERIFICAR TOKEN
# ==========================================

def verificar_token(token: str = Depends(oauth2_scheme)):

    error_credenciales = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token inválido, expirado o usuario inactivo",
        headers={"WWW-Authenticate": "Bearer"}
    )

    try:
        payload = jwt.decode(
            token,
            CLAVE_SECRETA,
            algorithms=[ALGORITMO]
        )
        
        if payload.get("tipo") != "acceso":
            raise error_credenciales

        id_usuario = payload.get("id_usuario")

        if not isinstance(id_usuario, int) or isinstance(id_usuario, bool):
            raise error_credenciales

    except JWTError:
        raise error_credenciales

    # Verificar el usuario y su rol actual en PostgreSQL
    with Session(motor_auth) as sesion:

        usuario = sesion.get(Usuario, id_usuario)

        if not usuario or not usuario.activo:
            raise error_credenciales

        rol = sesion.get(Rol, usuario.id_rol)

        if not rol:
            raise error_credenciales

        return {
            "id_usuario": usuario.id_usuario,
            "rol": rol.nombre_rol
        }


# ==========================================
# TOKENS DE ACTIVACIÓN / RECUPERACIÓN
# ==========================================
# Los uso para los links que mando por correo en RF-016 y RF-018.
# Son tokens de un solo propósito, con vencimiento corto, para que
# no sirvan como token de sesión normal.

def crear_token_proposito(id_usuario: int, proposito: str, minutos: int = 60) -> str:

    expiracion = datetime.utcnow() + timedelta(minutes=minutos)

    return jwt.encode(
        {
            "id_usuario": id_usuario,
            "proposito": proposito,
            "exp": expiracion
        },
        CLAVE_SECRETA,
        algorithm=ALGORITMO
    )


def verificar_token_proposito(token: str, proposito_esperado: str) -> int:
    """Devuelve el id_usuario si el token es válido y es del propósito
    esperado. Si no, lanza un HTTPException 400."""

    error = HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="El link no es válido o ya expiró. Solicítalo de nuevo."
    )

    try:
        payload = jwt.decode(token, CLAVE_SECRETA, algorithms=[ALGORITMO])
    except JWTError:
        raise error

    if payload.get("proposito") != proposito_esperado:
        raise error

    id_usuario = payload.get("id_usuario")

    if id_usuario is None:
        raise error

    return id_usuario


# ==========================================
# PERMISOS DE ADMINISTRADOR
# ==========================================

def solo_admin(
    usuario_actual=Depends(verificar_token)
):

    if usuario_actual["rol"].strip().lower() != "administrador":

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para esta acción"
        )

    return usuario_actual

def solo_gestion_tickets(
    usuario_actual=Depends(verificar_token)
):
    roles_permitidos = [
        "administrador",
        "administrador_mesa_ayuda"
    ]

    if usuario_actual["rol"] not in roles_permitidos:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para gestionar asignaciones de tickets"
        )

    return usuario_actual


# ==========================================
# PERMISOS DE TÉCNICO
# ==========================================

def solo_tecnico(
    usuario_actual=Depends(verificar_token)
):

    if usuario_actual["rol"] != "tecnico":

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los técnicos pueden realizar esta acción"
        )

    return usuario_actual