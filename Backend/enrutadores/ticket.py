import os
import shutil
from fastapi import APIRouter, HTTPException, status, BackgroundTasks, UploadFile, File, Form, Depends
from Modelos.tickets import tickets, TicketsEditar
from Modelos.esquemas_asignacion import AsignacionSchema
from Modelos.equipos import Equipo
from Modelos.ambientes import Ambiente
from Modelos.Usuarios import Usuario
from Modelos.roles import Rol
from Modelos.estados_ticket import estados_ticket
from Modelos.asig_tec import Asig_tec
from Modelos.His_tickets import His_ticket
from Modelos.mobiliario import Mobiliario, TipoMobiliario 
from datetime import datetime, date
from enrutadores.asig_tec import (
    registrar_asignacion,
    _enviar_notificacion_asignacion
)
from conexion_db import motor_admin
from sqlmodel import Session, select
from seguridad import verificar_token, solo_admin, solo_gestion_tickets
from servicios.correo import enviar_correo_notificacion, enviar_correo_cambio_estado
from servicios.validaciones_roles import validar_tecnico_activo
from servicios.acceso_tickets import consulta_tickets_permitidos
from sesiones_roles import Sesion_por_rol
from typing import Optional
from pydantic import BaseModel
from datetime import datetime

asis = APIRouter(
    prefix="/tickets",
    tags=["Tickets"], 
    dependencies=[Depends(verificar_token)]
)

@asis.get("/", response_model=list[tickets])
async def listar_tickets(
    session: Sesion_por_rol,
    usuario_actual: dict = Depends(verificar_token)
):
    return session.exec(consulta_tickets_permitidos(usuario_actual)).all()


@asis.get("/{id}", response_model=tickets)
async def listar_tickets_id(
    id: int,
    session: Sesion_por_rol,
    usuario_actual: dict = Depends(verificar_token)
):
    ticket = session.exec(
        consulta_tickets_permitidos(usuario_actual).where(tickets.id_ticket == id)
    ).first()
    if ticket is None:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")
    return ticket


# ==========================================
#  CREAR TICKET → Con soporte para imagen y notificaciones
# ==========================================

@asis.post("/", response_model=tickets)
async def crear_ticket(
    session: Sesion_por_rol,
    background_tasks: BackgroundTasks,
    motivo: str = Form(...),
    tipo_salida: str = Form(...),
    id_equipo: Optional[int] = Form(default=None),
    id_mobiliario: Optional[int] = Form(default=None),
    id_motivo_novedad: Optional[int] = Form(default=None),
    id_estado: Optional[int] = Form(default=None),
    atendido: bool = Form(False),
    fecha_salida: Optional[datetime] = Form(default=None),
    id_ambiente_destino: Optional[int] = Form(default=None),
    traslado_definitivo: Optional[bool] = Form(default=None),
    id_instructor_prestamo: Optional[int] = Form(default=None),
    fecha_devolucion: Optional[date] = Form(default=None),
    imagen: Optional[UploadFile] = File(default=None),
    usuario_actual: dict = Depends(verificar_token)
):
    rol = usuario_actual["rol"]
    id_usuario = usuario_actual["id_usuario"]
    if rol not in ("administrador", "instructor", "cuentadante"):
        raise HTTPException(status_code=403, detail="No puedes crear tickets")
    if tipo_salida not in ("dano", "traslado", "prestamo"):
        raise HTTPException(status_code=422, detail="Tipo de salida no válido")

    # Debe llegar un equipo o un mobiliario, nunca los dos ni ninguno.
    if (id_equipo is None) == (id_mobiliario is None):
        raise HTTPException(status_code=422,
                            detail="Indica un equipo o un mobiliario, pero no ambos")

    equipo = None
    mobiliario = None
    if id_equipo is not None:
        equipo = session.get(Equipo, id_equipo)
        if equipo is None:
            raise HTTPException(status_code=404, detail="Equipo no encontrado")
        id_ambiente_item = equipo.id_ambiente
    else:
        mobiliario = session.get(Mobiliario, id_mobiliario)
        if mobiliario is None:
            raise HTTPException(status_code=404, detail="Mobiliario no encontrado")
        id_ambiente_item = mobiliario.id_ambiente

    # Datos propios de cada tipo de salida; los que no corresponden se descartan.
    id_ambiente_origen = None
    if tipo_salida == "traslado":
        if id_ambiente_destino is None:
            raise HTTPException(status_code=422, detail="Selecciona el ambiente destino")
        if traslado_definitivo is None:
            raise HTTPException(status_code=422,
                                detail="Indica si el traslado es temporal o definitivo")
        if session.get(Ambiente, id_ambiente_destino) is None:
            raise HTTPException(status_code=404, detail="Ambiente destino no encontrado")
        if id_ambiente_destino == id_ambiente_item:
            raise HTTPException(status_code=422,
                                detail="El ambiente destino debe ser distinto al actual")
        if traslado_definitivo and rol != "administrador":
            raise HTTPException(status_code=403,
                                detail="Solo el administrador puede hacer traslados definitivos")
        id_ambiente_origen = id_ambiente_item
    else:
        id_ambiente_destino = None
        traslado_definitivo = None

    if tipo_salida == "prestamo":
        if id_instructor_prestamo == id_usuario:
            raise HTTPException(status_code=422, detail="No puedes prestarte el elemento a ti mismo")
        if id_instructor_prestamo is None:
            raise HTTPException(status_code=422, detail="Selecciona el instructor al que se presta")
        if fecha_devolucion is None:
            raise HTTPException(status_code=422, detail="Indica la fecha de devolución")
        if fecha_devolucion < date.today():
            raise HTTPException(status_code=422,
                                detail="La fecha de devolución no puede ser anterior a hoy")
        instructor = session.exec(
            select(Usuario.id_usuario)
            .join(Rol, Usuario.id_rol == Rol.id_rol)
            .where(Usuario.id_usuario == id_instructor_prestamo,
                   Rol.nombre_rol == "instructor",
                   Usuario.activo == True)  # noqa: E712
        ).first()
        if instructor is None:
            raise HTTPException(status_code=422, detail="El instructor seleccionado no es válido")
    else:
        id_instructor_prestamo = None
        fecha_devolucion = None

    # Solo el administrador puede decidir libremente el estado inicial.
    if rol != "administrador":
        nombre_estado = "Pendiente" if tipo_salida == "dano" else "Trasladado"
        estado = session.exec(select(estados_ticket).where(
            estados_ticket.nombre_e == nombre_estado
        )).first()
        if estado is None:
            raise HTTPException(status_code=500, detail="Estado inicial no configurado")
        id_estado = estado.id_estado
        atendido = False
    elif id_estado is None or session.get(estados_ticket, id_estado) is None:
        raise HTTPException(status_code=422, detail="Selecciona un estado válido")

    extension = None
    if imagen and imagen.filename:
        extension = os.path.splitext(imagen.filename)[1].lower()
        if extension not in (".jpg", ".jpeg", ".png"):
            raise HTTPException(status_code=400, detail="Solo se permiten imágenes JPG, JPEG o PNG")
        if imagen.size is not None and imagen.size > 5 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="La imagen supera 5 MB")

    nuevo = tickets(
        motivo=motivo, id_equipo=id_equipo, id_mobiliario=id_mobiliario,
        tipo_salida=tipo_salida, id_motivo_novedad=id_motivo_novedad,
        id_estado=id_estado, creado_por=id_usuario, atendido=atendido,
        fecha_salida=fecha_salida or datetime.now(),
        id_ambiente_origen=id_ambiente_origen,
        id_ambiente_destino=id_ambiente_destino,
        traslado_definitivo=traslado_definitivo,
        id_instructor_prestamo=id_instructor_prestamo,
        fecha_devolucion=fecha_devolucion,
    )
    session.add(nuevo)

    # El elemento queda dañado en el mismo commit que crea el ticket
    if tipo_salida == "dano":
        if equipo is not None:
            equipo.estado = "dañado"
            session.add(equipo)
        if mobiliario is not None:
            mobiliario.estado = "Dañado"
            session.add(mobiliario)

    # Traslado definitivo: el elemento cambia de ambiente en el mismo commit
    if tipo_salida == "traslado" and traslado_definitivo:
        if equipo is not None:
            equipo.id_ambiente = id_ambiente_destino
            session.add(equipo)
        if mobiliario is not None:
            mobiliario.id_ambiente = id_ambiente_destino
            session.add(mobiliario)

    session.commit()
    session.refresh(nuevo)

    if extension:
        carpeta = "uploads/tickets"
        os.makedirs(carpeta, exist_ok=True)
        ruta = os.path.join(carpeta, f"ticket_{nuevo.id_ticket}{extension}")
        try:
            with open(ruta, "wb") as archivo:
                shutil.copyfileobj(imagen.file, archivo)
            nuevo.imagen = ruta
            session.add(nuevo)
            session.commit()
            session.refresh(nuevo)
        except Exception:
            session.rollback()
            # No se borra el ticket ya creado: mantener registro y avisar al usuario.
            raise HTTPException(status_code=500, detail="Ticket registrado, pero falló la imagen")

    background_tasks.add_task(_enviar_notificacion_creacion, nuevo.id_ticket)
    return nuevo

# ==========================================
#  EDITAR TICKET → Si cambia el estado, notifica
# ==========================================
@asis.put("/{id}", response_model=tickets)
async def editar_ticket(
    id: int,
    datos_tik: TicketsEditar,
    session: Sesion_por_rol,
    background_tasks: BackgroundTasks,
    usuario_actual: dict = Depends(verificar_token)
):
    tik_bd = session.get(tickets, id)
    if not tik_bd:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El ticket con ID {id} no existe."
        )
    
    estado_anterior = tik_bd.id_estado
    
    tik_dict = datos_tik.model_dump(exclude_unset=True)

    rol = usuario_actual["rol"]
    id_usuario = usuario_actual["id_usuario"]

    # Administrador y mesa de ayuda:
    # pueden gestionar los datos del ticket,
    # pero no cambiar su creador ni su técnico asignado.
    if rol in ["administrador", "administrador_mesa_ayuda"]:
        campos_permitidos = {
            "motivo",
            "fecha_salida",
            "fecha_retorno",
            "atendido",
            "id_equipo",
            "id_estado",
            "id_motivo_novedad",
            "tipo_salida"
        }

    # Técnico: solamente puede actualizar el estado
    # y la atención de los tickets asignados a él.
    elif rol == "tecnico":

        if tik_bd.asignado_a != id_usuario:
            raise HTTPException(
                status_code=403,
                detail="Este ticket no está asignado a ti"
            )

        campos_permitidos = {
            "id_estado",
            "atendido",
            "fecha_retorno"
        }

    # Instructor: solamente puede editar un reporte
    # propio que todavía esté pendiente y sin técnico.
    elif rol == "instructor":

        estado_actual = session.get(
            estados_ticket,
            tik_bd.id_estado
        )

        if (
            tik_bd.creado_por != id_usuario
            or tik_bd.asignado_a is not None
            or not estado_actual
            or estado_actual.nombre_e.strip().lower() != "pendiente"
        ):
            raise HTTPException(
                status_code=403,
                detail="No puedes editar este reporte"
            )

        campos_permitidos = {
            "motivo",
            "id_equipo"
        }

    # Los demás perfiles no pueden editar tickets.
    else:
        raise HTTPException(
            status_code=403,
            detail="Tu rol no permite editar tickets"
        )

    # Rechazar cualquier campo que el rol no pueda modificar.
    campos_prohibidos = set(tik_dict) - campos_permitidos

    if campos_prohibidos:
        raise HTTPException(
            status_code=403,
            detail=(
                "No puedes modificar los siguientes campos: "
                + ", ".join(sorted(campos_prohibidos))
            )
        )

    # Aplicar únicamente las modificaciones autorizadas.
    tik_bd.sqlmodel_update(tik_dict)
    session.add(tik_bd)
    session.commit()
    session.refresh(tik_bd)
    
    estado_nuevo = tik_bd.id_estado
    if estado_nuevo != estado_anterior:
        background_tasks.add_task(
            _enviar_notificacion_cambio_estado,
            tik_bd.id_ticket,
            estado_anterior,
            estado_nuevo
        )
    
    return tik_bd
# ==========================================
#  ASIGNAR TÉCNICO (Tickets nuevos)
# ==========================================
@asis.put("/{id}/asignar", response_model=tickets, dependencies=[Depends(solo_gestion_tickets)])
async def asignar_tecnico(
    id: int,
    datos: AsignacionSchema,
    session: Sesion_por_rol,
    background_tasks: BackgroundTasks,
    usuario_actual: dict = Depends(verificar_token)
):
    with session.begin():
        asignacion = registrar_asignacion(session, id, datos.id_tecnico,
                                          usuario_actual["id_usuario"])
    session.refresh(asignacion)
    background_tasks.add_task(_enviar_notificacion_asignacion, asignacion.id_asignacion)
    return session.get(tickets, id)

# ==========================================
#  REASIGNAR TÉCNICO (Cambiar de técnico)
# ==========================================
@asis.put("/{id}/reasignar", response_model=tickets, dependencies=[Depends(solo_gestion_tickets)])
async def reasignar_tecnico(
    id: int,
    datos: AsignacionSchema,
    session: Sesion_por_rol,
    background_tasks: BackgroundTasks,
    usuario_actual: dict = Depends(verificar_token)
):
    # Actualizar ticket, historial y asignación en una sola transacción.
    with session.begin():
        ticket = session.exec(select(tickets).where(tickets.id_ticket == id).with_for_update()).first()
        if ticket is None:
            raise HTTPException(status_code=404, detail="Ticket no encontrado")
        if ticket.asignado_a is None:
            raise HTTPException(status_code=409, detail="Utiliza asignar para tickets sin técnico")
        if ticket.asignado_a == datos.id_tecnico:
            raise HTTPException(status_code=409, detail="El técnico ya está asignado")
        validar_tecnico_activo(session, datos.id_tecnico)
        tecnico_anterior = ticket.asignado_a
        ticket.asignado_a = datos.id_tecnico
        nueva_asig = Asig_tec(id_ticket=id, id_tecnico=datos.id_tecnico,
                               asignado_por=usuario_actual["id_usuario"])
        session.add(ticket)
        session.add(nueva_asig)
        session.add(His_ticket(
            id_ticket=id, id_usuario=usuario_actual["id_usuario"],
            accion="Reasignar técnico",
            observacion=f"De técnico #{tecnico_anterior} a #{datos.id_tecnico}",
            estado_resultante="Reasignado"
        ))
        session.flush()
    session.refresh(nueva_asig)
    background_tasks.add_task(_enviar_notificacion_asignacion, nueva_asig.id_asignacion)
    return session.get(tickets, id)

# ==========================================
#  DESASIGNAR TÉCNICO (Devolver a la cola)
# ==========================================
@asis.put("/{id}/desasignar", response_model=tickets, dependencies=[Depends(solo_gestion_tickets)])
async def desasignar_tecnico(
    id: int,
    session: Sesion_por_rol,
    usuario_actual: dict = Depends(verificar_token)
):
    with session.begin():
        ticket = session.exec(select(tickets).where(tickets.id_ticket == id).with_for_update()).first()
        if ticket is None:
            raise HTTPException(status_code=404, detail="Ticket no encontrado")
        if ticket.asignado_a is None:
            raise HTTPException(status_code=409, detail="El ticket ya está sin asignar")
        anterior = ticket.asignado_a
        ticket.asignado_a = None
        session.add(ticket)
        session.add(His_ticket(
            id_ticket=id, id_usuario=usuario_actual["id_usuario"],
            accion="Desasignar técnico",
            observacion=f"Se retiró al técnico #{anterior}",
            estado_resultante="Sin asignar"
        ))
    return session.get(tickets, id)

# Devolución de un equipo al ambiente (RF-007 / RF-010).

class RegistroEntrada(BaseModel):
    id_estado_entregado: int
    id_usuario_actual: int | None = None  # compatibilidad; el servidor usa el JWT


@asis.put("/{id}/registrar-entrada", response_model=tickets,dependencies=[Depends(solo_gestion_tickets)])
async def registrar_entrada(
    id: int,
    datos: RegistroEntrada,
    session: Sesion_por_rol,
    background_tasks: BackgroundTasks,
    usuario_actual: dict = Depends(verificar_token)
):
    with session.begin():
        ticket = session.exec(
            select(tickets).where(tickets.id_ticket == id).with_for_update()
        ).first()
        if ticket is None:
            raise HTTPException(status_code=404, detail="Ticket no encontrado")
        estado = session.get(estados_ticket, datos.id_estado_entregado)
        if estado is None or estado.nombre_e.strip().lower() != "entregado en ambiente":
            raise HTTPException(status_code=422, detail="Estado de entrega no válido")
        estado_anterior = ticket.id_estado
        ticket.id_estado = datos.id_estado_entregado
        ticket.atendido = True
        ticket.fecha_retorno = datetime.now()
        session.add(ticket)
        session.add(His_ticket(
            id_ticket=id,
            id_usuario=usuario_actual["id_usuario"],
            accion="Registrar entrada de equipo",
            observacion="Equipo devuelto al ambiente",
            estado_resultante="Entregado en ambiente"
        ))
    session.refresh(ticket)
    if estado_anterior != ticket.id_estado:
        background_tasks.add_task(
            _enviar_notificacion_cambio_estado, id, estado_anterior, ticket.id_estado
        )
    return ticket


#Eliminar ticket
@asis.delete("/{id}", response_model=tickets, dependencies=[Depends(solo_admin)])
async def eliminar_ticket(id: int, session: Sesion_por_rol):
    tik_bd = session.get(tickets, id)
    if not tik_bd:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El ticket con ID {id} no existe."
        )
    session.delete(tik_bd)
    session.commit()
    return tik_bd

def _item_y_ambiente(sesion, ticket):
    """Devuelve (nombre del elemento, ambiente) para un equipo o un mobiliario."""
    if ticket.id_equipo is not None:
        equipo = sesion.get(Equipo, ticket.id_equipo)
        if not equipo:
            print(f" No se encontró el equipo {ticket.id_equipo}")
            return None, None
        nombre = f"{equipo.nombre} ({equipo.marca})" if equipo.marca else equipo.nombre
        return nombre, sesion.get(Ambiente, equipo.id_ambiente)

    if ticket.id_mobiliario is not None:
        mob = sesion.get(Mobiliario, ticket.id_mobiliario)
        if not mob:
            print(f" No se encontró el mobiliario {ticket.id_mobiliario}")
            return None, None
        tipo = sesion.get(TipoMobiliario, mob.id_tipo_mob)
        nombre = f"{tipo.nombre_tm if tipo else 'Mobiliario'} ({mob.serial or mob.codigo})"
        return nombre, sesion.get(Ambiente, mob.id_ambiente)

    print(f" El ticket {ticket.id_ticket} no tiene equipo ni mobiliario")
    return None, None

# ==========================================
#  FUNCIÓN: NOTIFICAR CREACIÓN DE TICKET
# ==========================================
def _enviar_notificacion_creacion(id_ticket: int):
    try:
        with Session(motor_admin) as sesion:
            ticket = sesion.get(tickets, id_ticket)
            if not ticket:
                print(f" No se encontró el ticket {id_ticket}")
                return

            nombre_equipo, ambiente = _item_y_ambiente(sesion, ticket)

            # En un traslado definitivo el elemento ya está en el destino:
            # el ambiente de origen se lee del ticket.
            ambiente_origen = ambiente
            if ticket.id_ambiente_origen is not None:
                ambiente_origen = sesion.get(Ambiente, ticket.id_ambiente_origen) or ambiente
            ambiente_destino = None
            if ticket.id_ambiente_destino is not None:
                ambiente_destino = sesion.get(Ambiente, ticket.id_ambiente_destino)

            if ambiente_origen is None:
                print(f" No se pudo determinar el ambiente del ticket {id_ticket}")
                return

            creador = sesion.get(Usuario, ticket.creado_por)
            destinatarios = []

            # Cuentadante del ambiente de origen y, si es traslado, también el del destino
            for amb in (ambiente_origen, ambiente_destino):
                if amb is not None and amb.id_cuentadante:
                    cuentadante = sesion.get(Usuario, amb.id_cuentadante)
                    if cuentadante and cuentadante.correo_u:
                        destinatarios.append(cuentadante.correo_u)

            admins = sesion.exec(
                select(Usuario).join(Rol, Usuario.id_rol == Rol.id_rol)
                .where(Rol.nombre_rol == "administrador_mesa_ayuda")
            ).all()
            for admin in admins:
                if admin.correo_u:
                    destinatarios.append(admin.correo_u)

            if ticket.asignado_a:
                tec_asignado = sesion.get(Usuario, ticket.asignado_a)
                if tec_asignado and tec_asignado.correo_u:
                    destinatarios.append(tec_asignado.correo_u)
                    
            # Préstamo: se avisa también al instructor que recibe el elemento
            nombre_prestatario = None
            if ticket.id_instructor_prestamo:
                prestatario = sesion.get(Usuario, ticket.id_instructor_prestamo)
                if prestatario:
                    nombre_prestatario = f"{prestatario.nombre_u} {prestatario.apellidos_u}"
                    if prestatario.correo_u:
                        destinatarios.append(prestatario.correo_u)

            destinatarios = list(set(destinatarios))

            if creador and creador.correo_u in destinatarios:
                destinatarios.remove(creador.correo_u)

            if not destinatarios:
                print(f"No hay correos válidos para el ticket {id_ticket}")
                return

            nombre_creador = f"{creador.nombre_u} {creador.apellidos_u}" if creador else "Desconocido"
            nombre_ambiente = f"{ambiente_origen.nombre_a} - {ambiente_origen.ubicacion}"
            asunto = f"🚨 Nuevo Ticket #{ticket.id_ticket} - {nombre_equipo}"

            if ambiente_destino is not None:
                tipo_traslado = "definitivo" if ticket.traslado_definitivo else "temporal"
                nombre_ambiente = f"{ambiente_origen.nombre_a} → {ambiente_destino.nombre_a} (traslado {tipo_traslado})"
                asunto = f"🚚 Traslado {tipo_traslado} - Ticket #{ticket.id_ticket} - {nombre_equipo}"

            motivo_correo = ticket.motivo
            if nombre_prestatario:
                asunto = f"📤 Préstamo - Ticket #{ticket.id_ticket} - {nombre_equipo}"
                devolucion = ticket.fecha_devolucion.strftime("%d/%m/%Y") if ticket.fecha_devolucion else "sin fecha"
                motivo_correo = f"{ticket.motivo} — Prestado a {nombre_prestatario}, devolución: {devolucion}"
                
            datos_email = {
                "id_ticket": ticket.id_ticket,
                "equipo": nombre_equipo,
                "ambiente": nombre_ambiente,
                "motivo": motivo_correo,
                "creado_por": nombre_creador,
                "fecha_salida": str(ticket.fecha_salida) if ticket.fecha_salida else "N/A"
            }

            enviar_correo_notificacion(destinatarios, asunto, datos_email)

    except Exception as e:
        print(f"Error en notificación de creación: {e}")

# ==========================================
#  FUNCIÓN: NOTIFICAR CAMBIO DE ESTADO
# ==========================================
def _enviar_notificacion_cambio_estado(id_ticket: int, estado_anterior: int, estado_nuevo: int):
    try:
        with Session(motor_admin) as sesion:
            ticket = sesion.get(tickets, id_ticket)
            if not ticket:
                print(f" No se encontró el ticket {id_ticket}")
                return

            nombre_equipo, ambiente = _item_y_ambiente(sesion, ticket)
            if ambiente is None:
                print(f" No se pudo determinar el ambiente del ticket {id_ticket}")
                return

            estado_ant = sesion.get(estados_ticket, estado_anterior)
            estado_nue = sesion.get(estados_ticket, estado_nuevo)

            nombre_estado_anterior = estado_ant.nombre_e if estado_ant else "Desconocido"
            nombre_estado_nuevo = estado_nue.nombre_e if estado_nue else "Desconocido"
            color_estado_nuevo = estado_nue.color if estado_nue else "#333"

            creador = sesion.get(Usuario, ticket.creado_por)
            destinatarios = []

            if ambiente.id_cuentadante:
                cuentadante = sesion.get(Usuario, ambiente.id_cuentadante)
                if cuentadante and cuentadante.correo_u:
                    destinatarios.append(cuentadante.correo_u)

            if creador and creador.correo_u:
                destinatarios.append(creador.correo_u)

            destinatarios = list(set(destinatarios))

            if not destinatarios:
                print(f" No hay correos válidos para notificar cambio de estado del ticket {id_ticket}")
                return

            nombre_ambiente = f"{ambiente.nombre_a} - {ambiente.ubicacion}"

            datos_email = {
                "id_ticket": ticket.id_ticket,
                "equipo": nombre_equipo,
                "ambiente": nombre_ambiente,
                "estado_anterior": nombre_estado_anterior,
                "estado_nuevo": nombre_estado_nuevo,
                "color_estado": color_estado_nuevo,
                "motivo": ticket.motivo,
            }

            asunto = f" Ticket #{ticket.id_ticket} - Estado cambiado a '{nombre_estado_nuevo}'"
            enviar_correo_cambio_estado(destinatarios, asunto, datos_email)

    except Exception as e:
        print(f" Error en notificación de cambio de estado: {e}")