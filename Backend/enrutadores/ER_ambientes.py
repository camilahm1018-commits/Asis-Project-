from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.exc import IntegrityError
from sqlmodel import select
from Modelos.Usuarios import Usuario
from Modelos.roles import Rol
from sesiones_roles import Sesion_por_rol
from Modelos.ambientes import Ambiente, AmbienteCrear, AmbienteEditar, AmbienteLeer
from seguridad import verificar_token, solo_admin

asis = APIRouter(prefix="/ambientes", tags=["Ambientes"],
                 dependencies=[Depends(verificar_token)])


def validar_cuentadante(sesion, id_cuentadante):
    if id_cuentadante is None:
        return
    rol = sesion.exec(
        select(Rol.nombre_rol).join(Usuario, Usuario.id_rol == Rol.id_rol)
        .where(Usuario.id_usuario == id_cuentadante)
    ).first()
    if rol != "cuentadante":
        raise HTTPException(status_code=422, detail="Selecciona un cuentadante válido")


@asis.get("/", response_model=list[AmbienteLeer])
async def listar_ambientes(sesion: Sesion_por_rol):
    return sesion.exec(select(Ambiente)).all()


@asis.get("/mis-ambientes", response_model=list[AmbienteLeer])
async def listar_mis_ambientes(sesion: Sesion_por_rol,
                               usuario: dict = Depends(verificar_token)):
    rol = usuario["rol"]
    if rol in ("administrador", "administrador_mesa_ayuda"):
        q = select(Ambiente)
    elif rol == "cuentadante":
        q = select(Ambiente).where(Ambiente.id_cuentadante == usuario["id_usuario"])
    elif rol == "instructor":
        q = select(Ambiente).where(Ambiente.estado == "activo")
    else:
        raise HTTPException(status_code=403, detail="Rol no autorizado")
    return sesion.exec(q).all()


@asis.get("/{id_ambiente}", response_model=AmbienteLeer)
async def obtener_ambiente(id_ambiente: int, sesion: Sesion_por_rol):
    ambiente = sesion.get(Ambiente, id_ambiente)
    if ambiente is None:
        raise HTTPException(status_code=404, detail="Ambiente no encontrado")
    return ambiente


@asis.post("/", response_model=AmbienteLeer, dependencies=[Depends(solo_admin)])
async def crear_ambiente(datos_ambiente: AmbienteCrear, sesion: Sesion_por_rol):
    validar_cuentadante(sesion, datos_ambiente.id_cuentadante)
    nuevo = Ambiente.model_validate(datos_ambiente)
    try:
        sesion.add(nuevo)
        sesion.commit()
    except IntegrityError:
        sesion.rollback()
        raise HTTPException(status_code=409, detail="El número de ambiente ya existe o el responsable dejó de estar disponible")
    sesion.refresh(nuevo)
    return nuevo


@asis.put("/{id_ambiente}", response_model=AmbienteLeer, dependencies=[Depends(solo_admin)])
async def editar_ambiente(id_ambiente: int, datos_ambiente: AmbienteEditar, sesion: Sesion_por_rol):
    ambiente = sesion.get(Ambiente, id_ambiente)
    if ambiente is None:
        raise HTTPException(status_code=404, detail="Ambiente no encontrado")
    cambios = datos_ambiente.model_dump(exclude_unset=True)
    if "id_cuentadante" in cambios:
        validar_cuentadante(sesion, cambios["id_cuentadante"])
    ambiente.sqlmodel_update(cambios)
    sesion.add(ambiente)
    sesion.commit()
    sesion.refresh(ambiente)
    return ambiente


@asis.delete("/{id_ambiente}", response_model=AmbienteLeer,
             dependencies=[Depends(solo_admin)])
async def eliminar_ambiente(id_ambiente: int, sesion: Sesion_por_rol):
    ambiente = sesion.get(Ambiente, id_ambiente)
    if ambiente is None:
        raise HTTPException(status_code=404, detail="Ambiente no encontrado")
    eliminado = AmbienteLeer.model_validate(ambiente)
    try:
        sesion.delete(ambiente)
        sesion.commit()
    except IntegrityError:
        sesion.rollback()
        raise HTTPException(status_code=409, detail="El ambiente tiene equipos vinculados. Trasládalos antes de eliminarlo.")
    return eliminado
