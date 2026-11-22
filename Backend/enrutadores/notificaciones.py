from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import select
from sesiones_roles import Sesion_por_rol
from seguridad import verificar_token, solo_admin, solo_gestion_tickets
from Modelos.notificaciones import Notificacion, NotificacionCrear, NotificacionEditar
from Modelos.tickets import tickets

asis = APIRouter(prefix="/notificaciones", tags=["notificaciones"],
                 dependencies=[Depends(verificar_token)])


def autorizada(notif, usuario):
    return (usuario["rol"] in ("administrador", "administrador_mesa_ayuda")
            or notif.notificado_para == usuario["id_usuario"])


@asis.get("/notificaciones", response_model=list[Notificacion],
          dependencies=[Depends(solo_gestion_tickets)])
async def listar_notificaciones(sesion: Sesion_por_rol):
    return sesion.exec(select(Notificacion)).all()


@asis.get("/notificaciones/{id}", response_model=Notificacion)
async def obtener_notificacion(id: int, sesion: Sesion_por_rol,
                               usuario: dict = Depends(verificar_token)):
    notif = sesion.get(Notificacion, id)
    if notif is None or not autorizada(notif, usuario):
        raise HTTPException(status_code=404, detail="Notificación no encontrada")
    return notif


@asis.post("/notificaciones", response_model=Notificacion)
async def crear_notificacion(datos: NotificacionCrear, sesion: Sesion_por_rol,
                             usuario: dict = Depends(verificar_token)):
    rol = usuario["rol"]
    if rol not in ("administrador", "administrador_mesa_ayuda", "tecnico"):
        raise HTTPException(status_code=403, detail="No autorizado")
    t = sesion.get(tickets, datos.id_ticket)
    if t is None:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")
    if rol == "tecnico" and (t.asignado_a != usuario["id_usuario"] or datos.notificado_para != t.creado_por):
        raise HTTPException(status_code=403, detail="Destinatario o ticket no autorizado")
    payload = datos.model_dump()
    payload["notificado_por"] = usuario["id_usuario"]
    payload["enviada"] = False  # FrontEnd usa este campo como indicador de lectura.
    notif = Notificacion.model_validate(payload)
    sesion.add(notif)
    sesion.commit()
    sesion.refresh(notif)
    return notif


@asis.put("/notificaciones/{id}", response_model=Notificacion,
          dependencies=[Depends(solo_admin)])
async def editar_notificacion(id: int, datos: NotificacionEditar, sesion: Sesion_por_rol):
    notif = sesion.get(Notificacion, id)
    if notif is None:
        raise HTTPException(status_code=404, detail="Notificación no encontrada")
    notif.sqlmodel_update(datos.model_dump(exclude_unset=True))
    sesion.add(notif)
    sesion.commit()
    sesion.refresh(notif)
    return notif


@asis.delete("/notificaciones/{id}", response_model=Notificacion,
             dependencies=[Depends(solo_admin)])
async def eliminar_notificacion(id: int, sesion: Sesion_por_rol):
    notif = sesion.get(Notificacion, id)
    if notif is None:
        raise HTTPException(status_code=404, detail="Notificación no encontrada")
    sesion.delete(notif)
    sesion.commit()
    return notif


@asis.get("/usuario/{id_usuario}", response_model=list[Notificacion])
async def obtener_notificaciones_usuario(id_usuario: int, sesion: Sesion_por_rol,
                                         usuario: dict = Depends(verificar_token)):
    if usuario["id_usuario"] != id_usuario and usuario["rol"] != "administrador":
        raise HTTPException(status_code=403, detail="No puedes consultar otras notificaciones")
    return sesion.exec(select(Notificacion).where(
        Notificacion.notificado_para == id_usuario
    ).order_by(Notificacion.fecha_envio.desc())).all()


@asis.put("/marcar-leida/{id_notificacion}")
async def marcar_notificacion_leida(id_notificacion: int, sesion: Sesion_por_rol,
                                     usuario: dict = Depends(verificar_token)):
    notif = sesion.get(Notificacion, id_notificacion)
    if notif is None or notif.notificado_para != usuario["id_usuario"]:
        raise HTTPException(status_code=404, detail="Notificación no encontrada")
    notif.enviada = True
    sesion.add(notif)
    sesion.commit()
    return {"mensaje": "Notificación marcada como leída"}
