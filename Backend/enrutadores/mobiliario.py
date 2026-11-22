from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.exc import IntegrityError
from sqlmodel import select
from sesiones_roles import Sesion_por_rol
from Modelos.mobiliario import (
    Mobiliario, TipoMobiliario,
    MobiliarioCrear, MobiliarioEditar, MobiliarioLeer,
)
from Modelos.ambientes import Ambiente
from Modelos.tickets import tickets
from seguridad import verificar_token, solo_admin

asis = APIRouter(prefix="/mobiliario", tags=["Mobiliario"],
                 dependencies=[Depends(verificar_token)])


def ambiente_propio(sesion, id_ambiente, id_usuario):
    return sesion.exec(select(Ambiente.id_ambiente).where(
        Ambiente.id_ambiente == id_ambiente,
        Ambiente.id_cuentadante == id_usuario
    )).first() is not None


def a_leer(sesion, mob):
    tipo = sesion.get(TipoMobiliario, mob.id_tipo_mob)
    return MobiliarioLeer(**mob.model_dump(),
                          nombre_tm=tipo.nombre_tm if tipo else "")


@asis.get("/", response_model=list[MobiliarioLeer])
async def listar_mobiliario(sesion: Sesion_por_rol,
                            id_ambiente: int | None = Query(default=None)):
    q = select(Mobiliario, TipoMobiliario.nombre_tm).join(
        TipoMobiliario, TipoMobiliario.id_tipo_mob == Mobiliario.id_tipo_mob
    )
    if id_ambiente is not None:
        q = q.where(Mobiliario.id_ambiente == id_ambiente)
    q = q.order_by(TipoMobiliario.nombre_tm, Mobiliario.codigo)
    return [MobiliarioLeer(**m.model_dump(), nombre_tm=nombre)
            for m, nombre in sesion.exec(q).all()]


@asis.get("/{id_mobiliario}", response_model=MobiliarioLeer)
async def obtener_mobiliario(id_mobiliario: int, sesion: Sesion_por_rol):
    mob = sesion.get(Mobiliario, id_mobiliario)
    if mob is None:
        raise HTTPException(status_code=404, detail="Mobiliario no encontrado")
    return a_leer(sesion, mob)


@asis.post("/", response_model=MobiliarioLeer)
async def crear_mobiliario(datos: MobiliarioCrear, sesion: Sesion_por_rol,
                           usuario: dict = Depends(verificar_token)):
    if usuario["rol"] not in ("administrador", "cuentadante"):
        raise HTTPException(status_code=403, detail="No autorizado")
    if sesion.get(Ambiente, datos.id_ambiente) is None:
        raise HTTPException(status_code=404, detail="Ambiente no encontrado")
    if usuario["rol"] == "cuentadante" and not ambiente_propio(
        sesion, datos.id_ambiente, usuario["id_usuario"]
    ):
        raise HTTPException(status_code=403, detail="Ambiente no autorizado")
    if sesion.get(TipoMobiliario, datos.id_tipo_mob) is None:
        raise HTTPException(status_code=422, detail="Tipo de mobiliario no válido")
    nuevo = Mobiliario.model_validate(datos)
    sesion.add(nuevo)
    try:
        sesion.commit()
    except IntegrityError:
        sesion.rollback()
        raise HTTPException(status_code=409, detail="Ya existe mobiliario con ese serial")
    sesion.refresh(nuevo)
    return a_leer(sesion, nuevo)


@asis.put("/{id_mobiliario}", response_model=MobiliarioLeer)
async def editar_mobiliario(id_mobiliario: int, datos: MobiliarioEditar,
                            sesion: Sesion_por_rol,
                            usuario: dict = Depends(verificar_token)):
    mob = sesion.get(Mobiliario, id_mobiliario)
    if mob is None:
        raise HTTPException(status_code=404, detail="Mobiliario no encontrado")
    rol = usuario["rol"]
    if rol not in ("administrador", "cuentadante"):
        raise HTTPException(status_code=403, detail="No autorizado")
    cambios = datos.model_dump(exclude_unset=True)
    if rol == "cuentadante":
        if not ambiente_propio(sesion, mob.id_ambiente, usuario["id_usuario"]):
            raise HTTPException(status_code=403, detail="Mobiliario fuera de tu inventario")
        if "id_ambiente" in cambios and not ambiente_propio(
            sesion, cambios["id_ambiente"], usuario["id_usuario"]
        ):
            raise HTTPException(status_code=403, detail="Ambiente destino no autorizado")
    if "id_ambiente" in cambios and sesion.get(Ambiente, cambios["id_ambiente"]) is None:
        raise HTTPException(status_code=404, detail="Ambiente no encontrado")
    if "id_tipo_mob" in cambios and sesion.get(TipoMobiliario, cambios["id_tipo_mob"]) is None:
        raise HTTPException(status_code=422, detail="Tipo de mobiliario no válido")
    mob.sqlmodel_update(cambios)
    sesion.add(mob)
    try:
        sesion.commit()
    except IntegrityError:
        sesion.rollback()
        raise HTTPException(status_code=409, detail="Ya existe mobiliario con ese serial")
    sesion.refresh(mob)
    return a_leer(sesion, mob)


@asis.delete("/{id_mobiliario}", response_model=MobiliarioLeer,
             dependencies=[Depends(solo_admin)])
async def eliminar_mobiliario(id_mobiliario: int, sesion: Sesion_por_rol):
    mob = sesion.get(Mobiliario, id_mobiliario)
    if mob is None:
        raise HTTPException(status_code=404, detail="Mobiliario no encontrado")
    con_tickets = sesion.exec(
        select(tickets.id_ticket).where(tickets.id_mobiliario == id_mobiliario).limit(1)
    ).first()
    if con_tickets is not None:
        raise HTTPException(
            status_code=409,
            detail="Este mobiliario tiene tickets asociados; cambia su estado en vez de borrarlo"
        )
    eliminado = a_leer(sesion, mob)
    sesion.delete(mob)
    sesion.commit()
    return eliminado