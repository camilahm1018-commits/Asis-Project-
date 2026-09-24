from fastapi import APIRouter, HTTPException, status, BackgroundTasks
from sqlmodel import select, Session
from conexion_db import Sesion_dependencia, motor_bd
from Modelos.asig_tec import Asig_tec, Asig_tecEditar, Asig_tecCrear, Asig_tecLeer
from Modelos.Usuarios import Usuario
from Modelos.roles import Rol
from Modelos.tickets import tickets
from Modelos.equipos import Equipo
from Modelos.ambientes import Ambiente
from servicios.correo import enviar_correo_asignacion

asis = APIRouter(
    prefix="/asignacion",
    tags=["Asignacion Tecnico"]
)

@asis.get("/", response_model=list[Asig_tec])
async def listar_asig(session: Sesion_dependencia):
    lista_asig = session.exec(select(Asig_tec)).all()
    return lista_asig

@asis.get("/{id}", response_model=Asig_tec)
async def listar_asig_id(id: int, session: Sesion_dependencia):
    asig_bd = session.get(Asig_tec, id)
    if not asig_bd:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"La asignacion con ID {id} no existe."
        )
    return asig_bd

@asis.post("/", response_model=Asig_tec)
async def asignar_tecnico_a_ticket(
    datos: Asig_tecCrear,
    sesion: Sesion_dependencia,
    background_tasks: BackgroundTasks  # ← LA MAGIA DE FASTAPI
):
    # 1. Buscar técnico
    usuario = sesion.get(Usuario, datos.id_tecnico)
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El usuario seleccionado no existe"
        )

    # 2. Validar rol técnico
    rol = sesion.get(Rol, usuario.id_rol)
    if not rol:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El rol del usuario no existe"
        )

    if rol.nombre_rol.lower().strip() != "tecnico":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"No se puede asignar. El usuario tiene rol '{rol.nombre_rol}', se requiere tecnico."
        )

    # 3. Crear la asignación
    try:
        nueva_asignacion = Asig_tec.model_validate(datos)
        sesion.add(nueva_asignacion)
        sesion.commit()
        sesion.refresh(nueva_asignacion)

        # 4. 📧 Programar el envío del correo en segundo plano
        background_tasks.add_task(
            _enviar_notificacion_asignacion,
            nueva_asignacion.id_asignacion
        )

        return nueva_asignacion
    except Exception as e:
        sesion.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al crear asignacion: {str(e)}"
        )

@asis.put("/{id}", response_model=Asig_tec)
async def editar_asig(id: int, datos_asig: Asig_tecEditar, session: Sesion_dependencia):
    asig_bd = session.get(Asig_tec, id)
    if not asig_bd:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"La asignacion con ID {id} no existe."
        )
    datos = datos_asig.model_dump(exclude_unset=True)
    asig_bd.sqlmodel_update(datos)
    session.add(asig_bd)
    session.commit()
    session.refresh(asig_bd)
    return asig_bd

@asis.delete("/{id}", response_model=Asig_tec)
async def eliminar_asig(id: int, session: Sesion_dependencia):
    asig_bd = session.get(Asig_tec, id)
    if not asig_bd:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"La asignacion con ID {id} no existe."
        )
    session.delete(asig_bd)
    session.commit()
    return asig_bd


# ==========================================
# 📧 FUNCIÓN EN SEGUNDO PLANO PARA NOTIFICAR ASIGNACIÓN
# Destinatario: El técnico al que se le asignó el ticket
# ==========================================
def _enviar_notificacion_asignacion(id_asignacion: int):
    try:
        with Session(motor_bd) as sesion:
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