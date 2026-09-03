from datetime import datetime

from fastapi import APIRouter, HTTPException, status
from sqlmodel import select, Session

from Modelos.His_tickets import His_ticket
from Modelos.tickets import tickets
from conexion_db import Sesion_dependencia


asis = APIRouter(
    prefix="/His_tickets",
    tags=["Historial de Tickets"]
)


# ============================================================
# FUNCIÓN INTERNA PARA CREAR HISTORIAL
# ============================================================

def crear_historial(
    session: Session,
    id_ticket: int,
    id_usuario: int,
    accion: str,
    estado_resultante: str,
    observacion: str | None = None,
    fecha: datetime | None = None
):
    historial = His_ticket(
        accion=accion,
        observacion=observacion,
        estado_resultante=estado_resultante,
        id_ticket=id_ticket,
        id_usuario=id_usuario,
        fecha=fecha if fecha is not None else datetime.now()
    )

    session.add(historial)

    return historial


# ============================================================
# HISTORIAL DE UN TICKET
# ============================================================

@asis.get(
    "/ticket/{id_ticket}",
    response_model=list[His_ticket]
)
async def historial_por_ticket(
    id_ticket: int,
    session: Sesion_dependencia
):

    ticket = session.get(tickets, id_ticket)

    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"El ticket con ID {id_ticket} no existe."
        )

    historial = session.exec(
        select(His_ticket)
        .where(His_ticket.id_ticket == id_ticket)
        .order_by(His_ticket.fecha)
    ).all()

    return historial


# ============================================================
# HISTORIAL DE ACTIVIDAD DE UN USUARIO
# ============================================================

@asis.get(
    "/usuario/{id_usuario}",
    response_model=list[His_ticket]
)
async def historial_por_usuario(
    id_usuario: int,
    session: Sesion_dependencia
):

    historial = session.exec(
        select(His_ticket)
        .where(His_ticket.id_usuario == id_usuario)
        .order_by(His_ticket.fecha.desc())
    ).all()

    return historial


# ============================================================
# HISTORIAL DE UN EQUIPO
# ============================================================

@asis.get(
    "/equipo/{id_equipo}",
    response_model=list[His_ticket]
)
async def historial_por_equipo(
    id_equipo: int,
    session: Sesion_dependencia
):

    historial = session.exec(
        select(His_ticket)
        .join(
            tickets,
            His_ticket.id_ticket == tickets.id_ticket
        )
        .where(tickets.id_equipo == id_equipo)
        .order_by(His_ticket.fecha.desc())
    ).all()

    return historial


# ============================================================
# OBTENER UN REGISTRO ESPECÍFICO DEL HISTORIAL
# ============================================================

@asis.get(
    "/{id_historial}",
    response_model=His_ticket
)
async def obtener_historial(
    id_historial: int,
    session: Sesion_dependencia
):

    historial = session.get(His_ticket, id_historial)

    if not historial:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"El registro de historial con ID {id_historial} no existe."
        )

    return historial