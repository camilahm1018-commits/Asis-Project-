from fastapi import APIRouter, HTTPException, status, Depends
from sqlmodel import select

from conexion_db import Sesion_dependencia
from Modelos.ambientes import Ambiente, AmbienteCrear, AmbienteEditar, AmbienteLeer
from seguridad import verificar_token

asis = APIRouter(
    prefix="/ambientes",
    tags=["Ambientes"]
)


# ==========================================
# 1. LISTAR TODOS LOS AMBIENTES (Admin)
# ==========================================
@asis.get("/", response_model=list[AmbienteLeer])
async def listar_ambientes(sesion: Sesion_dependencia):
    return sesion.exec(select(Ambiente)).all()


# ==========================================
# 2. LISTAR MIS AMBIENTES (Filtrado por Rol)
# ==========================================
@asis.get("/mis-ambientes", response_model=list[AmbienteLeer])
async def listar_mis_ambientes(
    sesion: Sesion_dependencia,
    usuario_actual: dict = Depends(verificar_token)
):
    rol = usuario_actual.get("rol")
    id_usuario = usuario_actual.get("id_usuario")
    
    if rol in ["administrador", "administrador_mesa_ayuda"]:
        query = select(Ambiente)
    elif rol == "cuentadante":
        query = select(Ambiente).where(Ambiente.id_cuentadante == id_usuario)
    elif rol == "instructor":
        query = select(Ambiente).where(Ambiente.estado == "activo")
    else:
        raise HTTPException(status_code=403, detail="Rol no autorizado")

    return sesion.exec(query).all()


# ==========================================
# 3. OBTENER UN AMBIENTE POR ID
# ==========================================
@asis.get("/{id_ambiente}", response_model=AmbienteLeer)
async def obtener_ambiente(id_ambiente: int, sesion: Sesion_dependencia):
    ambiente = sesion.get(Ambiente, id_ambiente)
    if not ambiente:
        raise HTTPException(status_code=404, detail="Ambiente no encontrado")
    return ambiente


# ==========================================
# 4. CREAR AMBIENTE
# ==========================================
@asis.post("/", response_model=AmbienteLeer)
async def crear_ambiente(datos_ambiente: AmbienteCrear, sesion: Sesion_dependencia):
    nuevo_ambiente = Ambiente.model_validate(datos_ambiente)
    sesion.add(nuevo_ambiente)
    sesion.commit()
    sesion.refresh(nuevo_ambiente)
    return nuevo_ambiente


# ==========================================
# 5. EDITAR AMBIENTE
# ==========================================
@asis.put("/{id_ambiente}", response_model=AmbienteLeer)
async def editar_ambiente(
    id_ambiente: int,
    datos_ambiente: AmbienteEditar,
    sesion: Sesion_dependencia
):
    ambiente = sesion.get(Ambiente, id_ambiente)
    if not ambiente:
        raise HTTPException(status_code=404, detail="Ambiente no encontrado")
    
    ambiente_dict = datos_ambiente.model_dump(exclude_unset=True)
    ambiente.sqlmodel_update(ambiente_dict)
    sesion.add(ambiente)
    sesion.commit()
    sesion.refresh(ambiente)
    return ambiente


# ==========================================
# 6. ELIMINAR AMBIENTE
# ==========================================
@asis.delete("/{id_ambiente}", response_model=AmbienteLeer)
async def eliminar_ambiente(id_ambiente: int, sesion: Sesion_dependencia):
    ambiente = sesion.get(Ambiente, id_ambiente)
    if not ambiente:
        raise HTTPException(status_code=404, detail="Ambiente no encontrado")
    
    ambiente_eliminado = AmbienteLeer.model_validate(ambiente)
    sesion.delete(ambiente)
    sesion.commit()
    return ambiente_eliminado