from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import select
from Modelos.His_tickets import His_ticket, His_ticketCrear, His_ticketEditar
from Modelos.tickets import tickets
from seguridad import verificar_token, solo_admin
from sesiones_roles import Sesion_por_rol
from servicios.acceso_tickets import consulta_tickets_permitidos, puede_ver_ticket

asis = APIRouter(prefix="/His_tickets", tags=["Historial de tickets"],
                 dependencies=[Depends(verificar_token)])


def consulta_historial(usuario):
    ids_autorizados = consulta_tickets_permitidos(usuario).with_only_columns(tickets.id_ticket)
    return select(His_ticket).where(His_ticket.id_ticket.in_(ids_autorizados))


@asis.get("/his_tickets", response_model=list[His_ticket])
async def listar_his_tickets(sesion: Sesion_por_rol,
                             usuario: dict = Depends(verificar_token)):
    return sesion.exec(consulta_historial(usuario)).all()


@asis.get("/por-ticket/{id_ticket}", response_model=list[His_ticket])
async def historial_por_ticket(id_ticket: int, sesion: Sesion_por_rol,
                              usuario: dict = Depends(verificar_token)):
    if not puede_ver_ticket(sesion, usuario, id_ticket):
        raise HTTPException(status_code=404, detail="Ticket no encontrado")
    return sesion.exec(select(His_ticket).where(His_ticket.id_ticket == id_ticket)).all()


@asis.get("/his_tickets/{id_historial}", response_model=His_ticket)
async def listar_his_ticket_id(id_historial: int, sesion: Sesion_por_rol,
                               usuario: dict = Depends(verificar_token)):
    registro = sesion.get(His_ticket, id_historial)
    if registro is None or not puede_ver_ticket(sesion, usuario, registro.id_ticket):
        raise HTTPException(status_code=404, detail="Historial no encontrado")
    return registro


@asis.post("/his_tickets", response_model=His_ticket)
async def crear_his_ticket(datos_his_ticket: His_ticketCrear, sesion: Sesion_por_rol,
                           usuario: dict = Depends(verificar_token)):
    rol = usuario["rol"]
    if rol not in ("administrador", "administrador_mesa_ayuda", "tecnico"):
        raise HTTPException(status_code=403, detail="No puedes registrar historial")
    ticket = sesion.get(tickets, datos_his_ticket.id_ticket)
    if ticket is None:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")
    if rol == "tecnico" and ticket.asignado_a != usuario["id_usuario"]:
        raise HTTPException(status_code=403, detail="Ticket no asignado a ti")
    datos = datos_his_ticket.model_dump()
    datos["id_usuario"] = usuario["id_usuario"]
    nuevo = His_ticket.model_validate(datos)
    sesion.add(nuevo)
    sesion.commit()
    sesion.refresh(nuevo)
    return nuevo


@asis.put("/his_tickets/{id_historial}", response_model=His_ticket,
          dependencies=[Depends(solo_admin)])
async def editar_his_ticket(id_historial: int, datos_his_ticket: His_ticketEditar,
                            sesion: Sesion_por_rol):
    registro = sesion.get(His_ticket, id_historial)
    if registro is None:
        raise HTTPException(status_code=404, detail="Historial no encontrado")
    registro.sqlmodel_update(datos_his_ticket.model_dump(exclude_unset=True))
    sesion.add(registro)
    sesion.commit()
    sesion.refresh(registro)
    return registro


@asis.delete("/his_tickets/{id_historial}", response_model=His_ticket,
             dependencies=[Depends(solo_admin)])
async def eliminar_his_ticket(id_historial: int, sesion: Sesion_por_rol):
    registro = sesion.get(His_ticket, id_historial)
    if registro is None:
        raise HTTPException(status_code=404, detail="Historial no encontrado")
    sesion.delete(registro)
    sesion.commit()
    return registro
