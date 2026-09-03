from fastapi import APIRouter, HTTPException, status, Depends
from sqlmodel import Session

from conexion_db import Sesion_dependencia
from Modelos.tickets import tickets
from Modelos.estados_ticket import estados_ticket
from Modelos.cambiar_estado import CambioEstado
from enrutadores.His_tickets import crear_historial
from seguridad import verificar_token


asis = APIRouter(
    prefix="/cambio-estado",
    tags=["Cambio de Estado"]
)


@asis.patch("/{id_ticket}")
async def cambiar_estado_ticket(
    id_ticket: int,
    datos: CambioEstado,
    session: Sesion_dependencia,
    usuario_actual=Depends(verificar_token)
):
    # 1. Buscar el ticket
    ticket = session.get(tickets, id_ticket)

    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"El ticket con ID {id_ticket} no existe."
        )

    # 2. Buscar el nuevo estado
    nuevo_estado = session.get(estados_ticket, datos.id_estado)

    if not nuevo_estado:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"El estado con ID {datos.id_estado} no existe."
        )

    # 3. Buscar el estado anterior
    estado_anterior = session.get(
        estados_ticket,
        ticket.id_estado
    )

    if not estado_anterior:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El estado actual del ticket no existe."
        )

    # 4. Evitar cambiar al mismo estado
    if ticket.id_estado == datos.id_estado:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El ticket ya se encuentra en ese estado."
        )

    # 5. Guardar el cambio en el ticket
    ticket.id_estado = datos.id_estado

    session.add(ticket)

    # 6. Crear registro en el historial
    observacion = datos.observacion

    if not observacion:
        observacion = (
            f"El estado cambió de "
            f"'{estado_anterior.nombre_e}' "
            f"a '{nuevo_estado.nombre_e}'."
        )

    crear_historial(
        session=session,
        id_ticket=ticket.id_ticket,
        id_usuario=usuario_actual["id_usuario"],
        accion="Cambio de estado",
        observacion=observacion,
        estado_resultante=nuevo_estado.nombre_e
    )

    # 7. Guardar todo
    session.commit()
    session.refresh(ticket)

    return {
        "mensaje": "Estado del ticket actualizado correctamente.",
        "id_ticket": ticket.id_ticket,
        "estado_anterior": estado_anterior.nombre_e,
        "estado_nuevo": nuevo_estado.nombre_e,
        "ticket": ticket
    }