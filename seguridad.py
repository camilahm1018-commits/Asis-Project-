from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer
from conexion_db import Sesion_dependencia
from sqlmodel import select

# Clave secreta para firmar los tokens
# Cámbiala por una cadena larga y aleatoria en producción
CLAVE_SECRETA = "asis_cgmlti_clave_super_secreta_2026"
ALGORITMO = "HS256"
MINUTOS_EXPIRACION = 480  # 8 horas

# Contexto de encriptación con bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Le dice a FastAPI dónde está el endpoint de login
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def encriptar_contrasena(contrasena: str) -> str:
    """Convierte una contraseña en texto plano a hash bcrypt"""
    return pwd_context.hash(contrasena)


def verificar_contrasena(contrasena_plana: str, contrasena_hash: str) -> bool:
    """Compara una contraseña con su hash guardado en la BD"""
    return pwd_context.verify(contrasena_plana, contrasena_hash)


def crear_token(datos: dict) -> str:
    """Genera un token JWT con los datos del usuario"""
    datos_token = datos.copy()
    expiracion = datetime.utcnow() + timedelta(minutes=MINUTOS_EXPIRACION)
    datos_token.update({"exp": expiracion})
    return jwt.encode(datos_token, CLAVE_SECRETA, algorithm=ALGORITMO)


def verificar_token(token: str = Depends(oauth2_scheme)):
    """Verifica que el token sea válido y devuelve los datos del usuario"""
    error_credenciales = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token inválido o expirado",
        headers={"WWW-Authenticate": "Bearer"}
    )
    try:
        payload = jwt.decode(token, CLAVE_SECRETA, algorithms=[ALGORITMO])
        id_usuario: int = payload.get("id_usuario")
        rol: str = payload.get("rol")
        if id_usuario is None or rol is None:
            raise error_credenciales
        return {"id_usuario": id_usuario, "rol": rol}
    except JWTError:
        raise error_credenciales


def solo_admin(usuario_actual=Depends(verificar_token)):
    """Solo permite acceso a administradores"""
    if usuario_actual["rol"] not in ["administrador", "administrador_mesa_ayuda"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para esta acción"
        )
    return usuario_actual


def solo_tecnico(usuario_actual=Depends(verificar_token)):
    """Solo permite acceso a técnicos"""
    if usuario_actual["rol"] != "tecnico":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los técnicos pueden realizar esta acción"
        )
    return usuario_actual