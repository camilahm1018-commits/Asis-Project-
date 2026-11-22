from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, Depends, Query
from sqlmodel import select
from sesiones_roles import Sesion_por_rol
from Modelos.equipos import Equipo, EquipoCrear, EquipoEditar, EquipoLeer
from Modelos.ambientes import Ambiente
from Modelos.tickets import tickets
from seguridad import verificar_token, solo_admin

asis = APIRouter(prefix="/equipos", tags=["Equipos"],
                 dependencies=[Depends(verificar_token)])


def ambiente_propio(sesion, id_ambiente, id_usuario):
    return sesion.exec(select(Ambiente.id_ambiente).where(
        Ambiente.id_ambiente == id_ambiente,
        Ambiente.id_cuentadante == id_usuario
    )).first() is not None


@asis.get("/", response_model=list[EquipoLeer])
async def listar_equipos(sesion: Sesion_por_rol,
                         id_ambiente: int | None = Query(default=None)):
    q = select(Equipo)
    if id_ambiente is not None:
        q = q.where(Equipo.id_ambiente == id_ambiente)
    return sesion.exec(q).all()


@asis.get("/{id_equipo}", response_model=EquipoLeer)
async def obtener_equipo(id_equipo: int, sesion: Sesion_por_rol):
    equipo = sesion.get(Equipo, id_equipo)
    if equipo is None:
        raise HTTPException(status_code=404, detail="Equipo no encontrado")
    return equipo


@asis.post("/", response_model=EquipoLeer)
async def crear_equipo(datos_equipo: EquipoCrear, sesion: Sesion_por_rol,
                       usuario: dict = Depends(verificar_token)):
    if usuario["rol"] not in ("administrador", "cuentadante"):
        raise HTTPException(status_code=403, detail="No autorizado")
    if usuario["rol"] == "cuentadante" and not ambiente_propio(
        sesion, datos_equipo.id_ambiente, usuario["id_usuario"]
    ):
        raise HTTPException(status_code=403, detail="Ambiente no autorizado")
    nuevo = Equipo.model_validate(datos_equipo)
    sesion.add(nuevo)
    sesion.commit()
    sesion.refresh(nuevo)
    return nuevo


@asis.put("/{id_equipo}", response_model=EquipoLeer)
async def editar_equipo(id_equipo: int, datos_equipo: EquipoEditar,
                        sesion: Sesion_por_rol,
                        usuario: dict = Depends(verificar_token)):
    equipo = sesion.get(Equipo, id_equipo)
    if equipo is None:
        raise HTTPException(status_code=404, detail="Equipo no encontrado")
    rol = usuario["rol"]
    cambios = datos_equipo.model_dump(exclude_unset=True)
    if rol == "cuentadante":
        id_usuario = usuario["id_usuario"]
        if not ambiente_propio(sesion, equipo.id_ambiente, id_usuario):
            raise HTTPException(status_code=403, detail="Equipo fuera de tu inventario")
        if "id_ambiente" in cambios and not ambiente_propio(sesion, cambios["id_ambiente"], id_usuario):
            raise HTTPException(status_code=403, detail="Ambiente destino no autorizado")
    elif rol == "instructor":
        # Compatibilidad con el formulario de daño: solo permite marcar
        # como dañado un equipo que acaba de reportar el propio instructor.
        reportado = sesion.exec(select(tickets.id_ticket).where(
            tickets.id_equipo == id_equipo,
            tickets.creado_por == usuario["id_usuario"],
            tickets.tipo_salida == "dano",
            tickets.creado_en >= datetime.now() - timedelta(minutes=15)
        )).first()
        if cambios != {"estado": "dañado"} or reportado is None:
            raise HTTPException(status_code=403, detail="No puedes modificar este equipo")
    elif rol != "administrador":
        raise HTTPException(status_code=403, detail="No autorizado")
    equipo.sqlmodel_update(cambios)
    sesion.add(equipo)
    sesion.commit()
    sesion.refresh(equipo)
    return equipo


@asis.delete("/{id_equipo}", response_model=EquipoLeer,
             dependencies=[Depends(solo_admin)])
async def eliminar_equipo(id_equipo: int, sesion: Sesion_por_rol):
    equipo = sesion.get(Equipo, id_equipo)
    if equipo is None:
        raise HTTPException(status_code=404, detail="Equipo no encontrado")
    eliminado = EquipoLeer.model_validate(equipo)
    sesion.delete(equipo)
    sesion.commit()
    return eliminado
