from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer


# ==========================================
# CONFIGURACIÓN DEL TOKEN
# ==========================================

CLAVE_SECRETA = "asis_cgmlti_clave_super_secreta_2026"
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
        "exp": expiracion
    })

    return jwt.encode(
        datos_token,
        CLAVE_SECRETA,
        algorithm=ALGORITMO
    )


# ==========================================
# VERIFICAR TOKEN
# ==========================================

def verificar_token(
    token: str = Depends(oauth2_scheme)
):

    error_credenciales = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token inválido o expirado",
        headers={
            "WWW-Authenticate": "Bearer"
        }
    )

    try:

        payload = jwt.decode(
            token,
            CLAVE_SECRETA,
            algorithms=[ALGORITMO]
        )

        id_usuario: int = payload.get("id_usuario")
        rol: str = payload.get("rol")

        if id_usuario is None or rol is None:
            raise error_credenciales

        return {
            "id_usuario": id_usuario,
            "rol": rol
        }

    except JWTError:
        raise error_credenciales


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

    if usuario_actual["rol"] not in [
        "administrador",
        "administrador_mesa_ayuda"
    ]:

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para esta acción"
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