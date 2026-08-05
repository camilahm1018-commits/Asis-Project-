from Modelos.His_tickets import His_ticket, His_ticketCrear, His_ticketEditar
from fastapi import APIRouter, status, HTTPException
from conexion_db import Sesion_dependencia
from sqlmodel import select


asis = APIRouter(
    prefix="/His_tickets",
    tags=["Historial de tickets"]
)

@asis.get("/his_tickets", response_model=list[His_ticket])
async def listar_his_tickets(sesion: Sesion_dependencia):
    lista_his = sesion.exec(select(His_ticket)).all()
    return lista_his


@asis.get("/his_tickets/{id_historial}", response_model=His_ticket)
async def listar_his_ticket_id(id_historial: int, mi_sesion: Sesion_dependencia): # type: ignore

    his_ticket = mi_sesion.get(His_ticket, id_historial)
    if not his_ticket:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Historial de ticket no encontrado")

    return his_ticket


@asis.post("/his_tickets", response_model =His_ticket)
async def crear_his_ticket(datos_his_ticket: His_ticketCrear,  mi_sesion: Sesion_dependencia): # type: ignore
    nuevo_his_ticket = His_ticket.model_validate(datos_his_ticket.model_dump())
    mi_sesion.add(nuevo_his_ticket)
    mi_sesion.commit()
    mi_sesion.refresh(nuevo_his_ticket)
    return nuevo_his_ticket


@asis.patch("/his_tickets/{id_historial}", response_model=His_ticket)
async def editar_his_ticket(id_historial: int, datos_his_ticket: His_ticketEditar,  mi_sesion: Sesion_dependencia):

    his_ticket = mi_sesion.get(His_ticket, id_historial)

    if not his_ticket:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Historial de ticket no encontrado"
        )


    his_ticket_dict = datos_his_ticket.model_dump(exclude_unset=True)
    his_ticket.sqlmodel_update(his_ticket_dict)

    mi_sesion.add(his_ticket)
    mi_sesion.commit()
    mi_sesion.refresh(his_ticket)

    return his_ticket
        

@asis.delete("/his_tickets/{id_historial}", response_model=His_ticket)
async def eliminar_his_ticket(id_historial: int, mi_sesion: Sesion_dependencia):

    his_ticket = mi_sesion.get(His_ticket, id_historial)

    if not his_ticket:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Historial de ticket no encontrado"
        )

    his_ticket_eliminado = His_ticket.model_validate(his_ticket)

    mi_sesion.delete(his_ticket)
    mi_sesion.commit()

    return his_ticket_eliminado