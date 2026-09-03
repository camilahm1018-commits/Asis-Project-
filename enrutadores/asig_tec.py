from fastapi import APIRouter, HTTPException, status
from sqlmodel import select

from conexion_db import Sesion_dependencia

from Modelos.asig_tec import (
    Asig_tec,
    Asig_tecEditar,
    Asig_tecCrear
)

from Modelos.Usuarios import Usuario
from Modelos.roles import Rol
from Modelos.tickets import tickets
from Modelos.estados_ticket import estados_ticket

from enrutadores.His_tickets import crear_historial


asis = APIRouter(
    prefix="/asignacion",
    tags=["Asignacion Tecnico"]
)


# ============================================================
# LISTAR TODAS LAS ASIGNACIONES
# ============================================================

@asis.get("/", response_model=list[Asig_tec])
async def listar_asig(
    session: Sesion_dependencia
):

    lista_asig = session.exec(
        select(Asig_tec)
    ).all()

    return lista_asig


# ============================================================
# OBTENER UNA ASIGNACIÓN POR ID
# ============================================================

@asis.get("/{id}", response_model=Asig_tec)
async def listar_asig_id(
    id: int,
    session: Sesion_dependencia
):

    asig_bd = session.get(
        Asig_tec,
        id
    )

    if not asig_bd:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"La asignación con ID {id} no existe."
        )

    return asig_bd


# ============================================================
# ASIGNAR TÉCNICO A UN TICKET
# ============================================================

@asis.post("/", response_model=Asig_tec)
async def asignar_tecnico_a_ticket(
    datos: Asig_tecCrear,
    sesion: Sesion_dependencia
):

    # --------------------------------------------------------
    # BUSCAR EL USUARIO QUE SERÁ ASIGNADO
    # --------------------------------------------------------

    usuario = sesion.get(
        Usuario,
        datos.id_tecnico
    )

    if not usuario:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El usuario seleccionado no existe."
        )

    # --------------------------------------------------------
    # BUSCAR EL TICKET
    # --------------------------------------------------------

    ticket = sesion.get(
        tickets,
        datos.id_ticket
    )

    if not ticket:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El ticket seleccionado no existe."
        )

    # --------------------------------------------------------
    # BUSCAR EL ROL DEL USUARIO
    # --------------------------------------------------------

    rol = sesion.get(
        Rol,
        usuario.id_rol
    )

    if not rol:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El rol del usuario no existe."
        )

    # --------------------------------------------------------
    # VERIFICAR QUE SEA TÉCNICO
    # --------------------------------------------------------

    if rol.nombre_rol.lower().strip() != "tecnico":

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"No se puede asignar. "
                f"El usuario tiene rol '{rol.nombre_rol}', "
                f"se requiere tecnico."
            )
        )

    try:

        # ----------------------------------------------------
        # CREAR REGISTRO DE ASIGNACIÓN
        # ----------------------------------------------------

        nueva_asignacion = Asig_tec.model_validate(
            datos
        )

        sesion.add(nueva_asignacion)

        # ----------------------------------------------------
        # ACTUALIZAR EL TICKET
        # ----------------------------------------------------

        ticket.asignado_a = datos.id_tecnico

        sesion.add(ticket)

        # ----------------------------------------------------
        # OBTENER EL ESTADO ACTUAL DEL TICKET
        # ----------------------------------------------------

        estado = sesion.get(
            estados_ticket,
            ticket.id_estado
        )

        if not estado:

            sesion.rollback()

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El estado actual del ticket no existe."
            )

        # ----------------------------------------------------
        # CREAR REGISTRO EN EL HISTORIAL
        # ----------------------------------------------------

        crear_historial(
            session=sesion,
            id_ticket=ticket.id_ticket,
            id_usuario=datos.asignado_por,
            accion="Asignación de técnico",
            observacion=(
                f"El ticket fue asignado al técnico "
                f"{usuario.nombre_u}."
            ),
            estado_resultante=estado.nombre_e,
            fecha=datos.fecha_asignacion
        )

        # ----------------------------------------------------
        # GUARDAR TODO
        # ----------------------------------------------------

        sesion.commit()

        sesion.refresh(nueva_asignacion)

        return nueva_asignacion

    except HTTPException:
        raise

    except Exception as e:

        sesion.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al crear asignación: {str(e)}"
        )


# ============================================================
# EDITAR ASIGNACIÓN
# ============================================================

@asis.put("/{id}", response_model=Asig_tec)
async def editar_asig(
    id: int,
    datos_asig: Asig_tecEditar,
    session: Sesion_dependencia
):

    asig_bd = session.get(
        Asig_tec,
        id
    )

    if not asig_bd:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"La asignación con ID {id} no existe."
        )

    datos = datos_asig.model_dump(
        exclude_unset=True
    )

    if not datos:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se enviaron cambios para actualizar."
        )

    asig_bd.sqlmodel_update(datos)

    session.add(asig_bd)

    session.commit()

    session.refresh(asig_bd)

    return asig_bd


# ============================================================
# ELIMINAR ASIGNACIÓN
# ============================================================

@asis.delete("/{id}", response_model=Asig_tec)
async def eliminar_asig(
    id: int,
    session: Sesion_dependencia
):

    asig_bd = session.get(
        Asig_tec,
        id
    )

    if not asig_bd:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"La asignación con ID {id} no existe."
        )

    session.delete(asig_bd)

    session.commit()

    return asig_bd

