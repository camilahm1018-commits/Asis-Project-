from fastapi import APIRouter, HTTPException, status
from sqlmodel import select

from Modelos.tickets import (
    tickets,
    TicketsCrear,
    TicketsEditar
)

from Modelos.His_tickets import His_ticket
from Modelos.estados_ticket import estados_ticket

from conexion_db import Sesion_dependencia

from enrutadores.His_tickets import crear_historial


asis = APIRouter(
    prefix="/tickets",
    tags=["Tickets"]
)


# ============================================================
# LISTAR TODOS LOS TICKETS
# ============================================================

@asis.get("/", response_model=list[tickets])
async def listar_tickets(
    session: Sesion_dependencia
):

    lista_tickets = session.exec(
        select(tickets)
    ).all()

    return lista_tickets


# ============================================================
# TICKETS DE UN EQUIPO
# ============================================================

@asis.get(
    "/equipo/{id_equipo}",
    response_model=list[tickets]
)
async def tickets_equipo(
    id_equipo: int,
    session: Sesion_dependencia
):

    lista = session.exec(
        select(tickets)
        .where(tickets.id_equipo == id_equipo)
        .order_by(tickets.creado_en.desc())
    ).all()

    return lista


# ============================================================
# TICKETS CREADOS POR UN USUARIO
# ============================================================

@asis.get(
    "/usuario/{id_usuario}",
    response_model=list[tickets]
)
async def tickets_usuario(
    id_usuario: int,
    session: Sesion_dependencia
):

    lista = session.exec(
        select(tickets)
        .where(tickets.creado_por == id_usuario)
        .order_by(tickets.creado_en.desc())
    ).all()

    return lista


# ============================================================
# CREAR TICKET
# ============================================================

@asis.post("/", response_model=tickets)
async def crear_ticket(
    datos_tik: TicketsCrear,
    session: Sesion_dependencia
):

    # --------------------------------------------------------
    # CREAR TICKET
    # --------------------------------------------------------

    tik_validado = tickets.model_validate(
        datos_tik.model_dump()
    )

    session.add(tik_validado)

    # Necesitamos el ID del ticket antes de crear
    # su registro en historial.
    session.flush()

    # --------------------------------------------------------
    # VERIFICAR QUE EL ESTADO EXISTA
    # --------------------------------------------------------

    estado = session.get(
        estados_ticket,
        tik_validado.id_estado
    )

    if not estado:

        session.rollback()

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El estado con ID {tik_validado.id_estado} no existe."
        )

    # --------------------------------------------------------
    # CREAR PRIMER REGISTRO DEL HISTORIAL
    # --------------------------------------------------------

    crear_historial(
        session=session,
        id_ticket=tik_validado.id_ticket,
        id_usuario=tik_validado.creado_por,
        accion="Creación del ticket",
        observacion="Se creó el ticket correctamente.",
        estado_resultante=estado.nombre_e,
        fecha=tik_validado.creado_en
    )

    # --------------------------------------------------------
    # GUARDAR TODO
    # --------------------------------------------------------

    session.commit()

    session.refresh(tik_validado)

    return tik_validado


# ============================================================
# OBTENER TICKET POR ID
# ============================================================

@asis.get(
    "/{id}",
    response_model=tickets
)
async def listar_tickets_id(
    id: int,
    session: Sesion_dependencia
):

    tik_bd = session.get(
        tickets,
        id
    )

    if not tik_bd:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"El ticket con ID {id} no existe."
        )

    return tik_bd


# ============================================================
# EDITAR TICKET
# ============================================================

@asis.put(
    "/{id}",
    response_model=tickets
)
async def editar_ticket(
    id: int,
    datos_tik: TicketsEditar,
    id_usuario: int,
    session: Sesion_dependencia
):

    tik_bd = session.get(
        tickets,
        id
    )

    if not tik_bd:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"El ticket con ID {id} no existe."
        )

    # --------------------------------------------------------
    # GUARDAR VALORES ANTERIORES
    # --------------------------------------------------------

    fecha_salida_anterior = tik_bd.fecha_salida
    fecha_retorno_anterior = tik_bd.fecha_retorno
    atendido_anterior = tik_bd.atendido
    motivo_anterior = tik_bd.motivo

    # --------------------------------------------------------
    # OBTENER CAMBIOS
    # --------------------------------------------------------

    tik_dict = datos_tik.model_dump(
        exclude_unset=True
    )

    if not tik_dict:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se enviaron cambios para actualizar."
        )

    # --------------------------------------------------------
    # ACTUALIZAR TICKET
    # --------------------------------------------------------

    tik_bd.sqlmodel_update(tik_dict)

    session.add(tik_bd)

    # --------------------------------------------------------
    # OBTENER ESTADO ACTUAL
    # --------------------------------------------------------

    estado_actual = session.get(
        estados_ticket,
        tik_bd.id_estado
    )

    if not estado_actual:

        session.rollback()

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El estado del ticket no existe."
        )

    # --------------------------------------------------------
    # CAMBIO DEL MOTIVO DEL TICKET
    # --------------------------------------------------------

    if (
        "motivo" in tik_dict
        and tik_dict["motivo"] != motivo_anterior
    ):

        crear_historial(
            session=session,
            id_ticket=tik_bd.id_ticket,
            id_usuario=id_usuario,
            accion="Actualización del motivo",
            observacion="Se actualizó el motivo del ticket.",
            estado_resultante=estado_actual.nombre_e
        )

    # --------------------------------------------------------
    # REGISTRO DE SALIDA DEL EQUIPO
    # --------------------------------------------------------

    if (
        "fecha_salida" in tik_dict
        and tik_dict["fecha_salida"] != fecha_salida_anterior
    ):

        if tik_bd.fecha_salida is not None:

            observacion = (
                "Se registró la salida del equipo "
                "para atención o mantenimiento."
            )

        else:

            observacion = (
                "Se eliminó la fecha de salida "
                "registrada anteriormente."
            )

        crear_historial(
            session=session,
            id_ticket=tik_bd.id_ticket,
            id_usuario=id_usuario,
            accion="Salida del equipo",
            observacion=observacion,
            estado_resultante=estado_actual.nombre_e
        )

    # --------------------------------------------------------
    # REGISTRO DE RETORNO DEL EQUIPO
    # --------------------------------------------------------

    if (
        "fecha_retorno" in tik_dict
        and tik_dict["fecha_retorno"] != fecha_retorno_anterior
    ):

        if tik_bd.fecha_retorno is not None:

            observacion = (
                "Se registró el retorno del equipo."
            )

        else:

            observacion = (
                "Se eliminó la fecha de retorno "
                "registrada anteriormente."
            )

        crear_historial(
            session=session,
            id_ticket=tik_bd.id_ticket,
            id_usuario=id_usuario,
            accion="Retorno del equipo",
            observacion=observacion,
            estado_resultante=estado_actual.nombre_e
        )

    # --------------------------------------------------------
    # CAMBIO DE ATENCIÓN
    # --------------------------------------------------------

    if (
        "atendido" in tik_dict
        and tik_dict["atendido"] != atendido_anterior
    ):

        if tik_bd.atendido:

            observacion = (
                "El ticket fue marcado como atendido."
            )

        else:

            observacion = (
                "El ticket dejó de estar marcado como atendido."
            )

        crear_historial(
            session=session,
            id_ticket=tik_bd.id_ticket,
            id_usuario=id_usuario,
            accion="Cambio de atención",
            observacion=observacion,
            estado_resultante=estado_actual.nombre_e
        )

    # --------------------------------------------------------
    # GUARDAR CAMBIOS + HISTORIAL
    # --------------------------------------------------------

    session.commit()

    session.refresh(tik_bd)

    return tik_bd


# ============================================================
# ELIMINAR TICKET
# ============================================================

@asis.delete("/{id}")
async def eliminar_ticket(
    id: int,
    session: Sesion_dependencia
):

    tik_bd = session.get(
        tickets,
        id
    )

    if not tik_bd:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"El ticket con ID {id} no existe."
        )

    # --------------------------------------------------------
    # VERIFICAR SI TIENE HISTORIAL
    # --------------------------------------------------------

    historial = session.exec(
        select(His_ticket)
        .where(His_ticket.id_ticket == id)
    ).first()

    if historial:

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "No se puede eliminar este ticket porque "
                "tiene registros en su historial. "
                "La trazabilidad debe conservarse."
            )
        )

    # --------------------------------------------------------
    # ELIMINAR
    # --------------------------------------------------------

    session.delete(tik_bd)

    session.commit()

    return {
        "mensaje": f"El ticket {id} fue eliminado correctamente."
    }