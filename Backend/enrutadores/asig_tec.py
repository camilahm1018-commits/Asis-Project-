from fastapi import APIRouter, HTTPException, status, BackgroundTasks, Depends
from pydantic import BaseModel, ConfigDict
from seguridad import verificar_token, solo_gestion_tickets, solo_tecnico
from sqlmodel import select, Session
from conexion_db import motor_admin
from Modelos.asig_tec import Asig_tec, Asig_tecEditar, Asig_tecCrear, Asig_tecLeer
from Modelos.Usuarios import Usuario
from Modelos.roles import Rol
from Modelos.esquemas_asignacion import SolicitudAsignacion
from Modelos.tickets import tickets
from Modelos.equipos import Equipo
from Modelos.ambientes import Ambiente
from servicios.correo import enviar_correo_asignacion
from servicios.validaciones_roles import validar_tecnico_activo
from servicios.notificaciones_ticket import avisar_evento_ticket
from sesiones_roles import Sesion_por_rol
from datetime import datetime

asis = APIRouter(
    prefix="/asignacion",
    tags=["Asignacion Tecnico"],
    dependencies=[Depends(verificar_token)]
)


def registrar_asignacion(
    sesion: Session,
    id_ticket: int,
    id_tecnico: int,
    id_asignador: int
):
    # Bloqueamos el ticket mientras se realiza la asignación.
    ticket = sesion.exec(
        select(tickets)
        .where(tickets.id_ticket == id_ticket)
        .with_for_update()
    ).first()

    if not ticket:
        raise HTTPException(
            status_code=404,
            detail="Ticket no encontrado"
        )

    # Impedir que dos personas tomen el mismo ticket.
    if ticket.asignado_a is not None:
        raise HTTPException(
            status_code=409,
            detail="Este ticket ya tiene un técnico asignado"
        )

    validar_tecnico_activo(
        sesion=sesion,
        id_tecnico=id_tecnico
    )

    # Actualizar el ticket.
    ticket.asignado_a = id_tecnico

    # Registrar quién hizo la asignación.
    nueva_asignacion = Asig_tec(
        id_ticket=id_ticket,
        id_tecnico=id_tecnico,
        asignado_por=id_asignador
    )

    sesion.add(ticket)
    sesion.add(nueva_asignacion)
    sesion.flush()

    return nueva_asignacion

def cerrar_asignacion_vigente(sesion: Session, id_ticket: int, id_tecnico: int, motivo: str):
    """Pone fecha al fin de la asignación abierta del técnico en ese ticket.
    motivo: 'reasignacion' o 'desasignacion'."""
    vigente = sesion.exec(
        select(Asig_tec)
        .where(
            Asig_tec.id_ticket == id_ticket,
            Asig_tec.id_tecnico == id_tecnico,
            Asig_tec.fecha_reasignacion.is_(None),
            Asig_tec.fecha_desasignacion.is_(None),
        )
        .order_by(Asig_tec.id_asignacion.desc())
    ).first()
    if vigente is None:
        return  # asignaciones antiguas que ya no tienen fila abierta
    ahora = datetime.now()
    if motivo == "reasignacion":
        vigente.fecha_reasignacion = ahora
    else:
        vigente.fecha_desasignacion = ahora
    sesion.add(vigente)

@asis.get("/", response_model=list[Asig_tec], dependencies=[Depends(solo_gestion_tickets)])
async def listar_asig(session: Sesion_por_rol):
    lista_asig = session.exec(select(Asig_tec)).all()
    return lista_asig

@asis.get("/{id}", response_model=Asig_tec, dependencies=[Depends(solo_gestion_tickets)])
async def listar_asig_id(id: int, session: Sesion_por_rol):
    asig_bd = session.get(Asig_tec, id)
    if not asig_bd:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"La asignacion con ID {id} no existe."
        )
    return asig_bd

@asis.post(
    "/",
    response_model=Asig_tec,
    dependencies=[Depends(solo_gestion_tickets)]
)
async def asignar_tecnico_a_ticket(
    datos: SolicitudAsignacion,
    sesion: Sesion_por_rol,
    background_tasks: BackgroundTasks,
    usuario_actual: dict = Depends(verificar_token)
):
    with sesion.begin():
        nueva_asignacion = registrar_asignacion(
            sesion=sesion,
            id_ticket=datos.id_ticket,
            id_tecnico=datos.id_tecnico,
            id_asignador=usuario_actual["id_usuario"]
        )

    sesion.refresh(nueva_asignacion)

    background_tasks.add_task(
        _enviar_notificacion_asignacion,
        nueva_asignacion.id_asignacion
    )

    return nueva_asignacion

@asis.post(
    "/tomar/{id_ticket}",
    response_model=Asig_tec,
    dependencies=[Depends(solo_tecnico)]
)
async def tomar_ticket(
    id_ticket: int,
    sesion: Sesion_por_rol,
    background_tasks: BackgroundTasks,
    usuario_actual: dict = Depends(verificar_token)
):
    id_tecnico = usuario_actual["id_usuario"]

    with sesion.begin():
        nueva_asignacion = registrar_asignacion(
            sesion=sesion,
            id_ticket=id_ticket,
            id_tecnico=id_tecnico,
            id_asignador=id_tecnico
        )

    sesion.refresh(nueva_asignacion)

    background_tasks.add_task(
        _enviar_notificacion_asignacion,
        nueva_asignacion.id_asignacion
    )

    return nueva_asignacion




# ==========================================
# 📧 FUNCIÓN EN SEGUNDO PLANO PARA NOTIFICAR ASIGNACIÓN
# Destinatario: El técnico al que se le asignó el ticket
# ==========================================
def _enviar_notificacion_asignacion(id_asignacion: int):
    try:
        with Session(motor_admin) as sesion:
            # 1. Obtener la asignación
            asignacion = sesion.get(Asig_tec, id_asignacion)
            if not asignacion:
                print(f"No se encontro la asignacion {id_asignacion}")
                return

            # 2. Obtener el ticket
            ticket = sesion.get(tickets, asignacion.id_ticket)
            if not ticket:
                print(f"No se encontro el ticket {asignacion.id_ticket}")
                return

            # 3. Obtener el equipo
            equipo = sesion.get(Equipo, ticket.id_equipo)
            if not equipo:
                print(f"No se encontro el equipo {ticket.id_equipo}")
                return

            # 4. Obtener el ambiente
            ambiente = sesion.get(Ambiente, equipo.id_ambiente)
            if not ambiente:
                print(f"No se encontro el ambiente {equipo.id_ambiente}")
                return

            # 5. Obtener el técnico al que se le asignó
            tecnico = sesion.get(Usuario, asignacion.id_tecnico)
            avisar_evento_ticket(
                sesion, ticket.id_ticket, asignacion.asignado_por, [tecnico],
                f"ASIS: tienes asignado el ticket #{ticket.id_ticket}. Consulta el detalle en ASIS.",
            )
            if not tecnico or not tecnico.correo_u:
                print(f"El tecnico {asignacion.id_tecnico} no tiene correo")
                return

            # 6. Obtener quién reportó el ticket (instructor)
            creador = sesion.get(Usuario, ticket.creado_por)
            nombre_creador = f"{creador.nombre_u} {creador.apellidos_u}" if creador else "Desconocido"

            # 7. Obtener quién asignó (admin mesa de ayuda)
            asignador = sesion.get(Usuario, asignacion.asignado_por)
            nombre_asignador = f"{asignador.nombre_u} {asignador.apellidos_u}" if asignador else "Desconocido"

            # 8. 🎯 Destinatario: SOLO el técnico
            destinatarios = [tecnico.correo_u]
            print(f"📧 Tecnico asignado: {tecnico.correo_u}")

            # 9. Preparar datos del correo
            nombre_tecnico = f"{tecnico.nombre_u} {tecnico.apellidos_u}"
            nombre_equipo = f"{equipo.nombre} ({equipo.marca})" if equipo.marca else equipo.nombre
            nombre_ambiente = f"{ambiente.nombre_a} - {ambiente.ubicacion}"

            datos_email = {
                "id_ticket": ticket.id_ticket,
                "equipo": nombre_equipo,
                "ambiente": nombre_ambiente,
                "motivo": ticket.motivo,
                "reportado_por": nombre_creador,
                "asignado_por": nombre_asignador,
                "fecha_asignacion": str(asignacion.fecha_asignacion) if asignacion.fecha_asignacion else "N/A"
            }

            asunto = f"👨‍💻 Nuevo Ticket Asignado #{ticket.id_ticket} - {nombre_equipo}"

            # 10. Enviar el correo
            enviar_correo_asignacion(destinatarios, asunto, datos_email)

    except Exception as e:
        print(f"Error en notificacion de asignacion: {e}")