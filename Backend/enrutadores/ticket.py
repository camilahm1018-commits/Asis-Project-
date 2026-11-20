import os
import shutil
from fastapi import APIRouter, HTTPException, status, BackgroundTasks, UploadFile, File, Form, Depends
from Modelos.tickets import tickets, TicketsEditar, TicketsLeer
from Modelos.esquemas_asignacion import AsignacionSchema
from Modelos.equipos import Equipo
from Modelos.ambientes import Ambiente
from Modelos.Usuarios import Usuario
from Modelos.roles import Rol
from Modelos.estados_ticket import estados_ticket
from Modelos.asig_tec import Asig_tec
from Modelos.His_tickets import His_ticket
from Modelos.notificaciones import Notificacion
from Modelos.validacion import TextoObligatorio
from sqlalchemy import delete, func
from sqlalchemy.exc import IntegrityError
from enrutadores.asig_tec import (
    registrar_asignacion,
    _enviar_notificacion_asignacion
)
from conexion_db import motor_admin
from sqlmodel import Session, select
from seguridad import verificar_token, solo_admin, solo_gestion_tickets
from servicios.correo import enviar_correo_notificacion, enviar_correo_cambio_estado
from servicios.validaciones_roles import validar_tecnico_activo
from servicios.notificaciones_ticket import avisar_evento_ticket
from servicios.acceso_tickets import (
    ESTADO_ENTREGADO,
    consulta_tickets_permitidos,
    equipos_del_cuentadante,
    nombre_normalizado,
    restringir_entrada,
)
from sesiones_roles import Sesion_por_rol
from typing import Annotated, Optional
from datetime import datetime

asis = APIRouter(
    prefix="/tickets",
    tags=["Tickets"], 
    dependencies=[Depends(verificar_token)]
)

@asis.get("/", response_model=list[TicketsLeer])
async def listar_tickets(
    session: Sesion_por_rol,
    usuario_actual: dict = Depends(verificar_token)
):
    visibles = session.exec(consulta_tickets_permitidos(usuario_actual)).all()
    if not visibles:
        return []
    estados = dict(session.exec(select(estados_ticket.id_estado, estados_ticket.nombre_e)).all())
    propios = set()
    if usuario_actual["rol"] == "cuentadante":
        propios = set(session.exec(equipos_del_cuentadante(usuario_actual["id_usuario"])).all())
    return [
        TicketsLeer.model_validate(ticket, update={
            "puede_registrar_entrada": restringir_entrada(
                ticket, estados.get(ticket.id_estado, ""), usuario_actual, ticket.id_equipo in propios
            ) is None
        })
        for ticket in visibles
    ]


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
# 🎫 CREAR TICKET → Con soporte para imagen y notificaciones
# ==========================================

@asis.post("/", response_model=tickets)
async def crear_ticket(
    session: Sesion_por_rol,
    background_tasks: BackgroundTasks,
    motivo: Annotated[TextoObligatorio, Form()],
    id_equipo: int = Form(...),
    tipo_salida: str = Form(...),
    id_motivo_novedad: Optional[int] = Form(default=None),
    id_estado: Optional[int] = Form(default=None),
    atendido: bool = Form(False),
    fecha_salida: Optional[datetime] = Form(default=None),
    imagen: Optional[UploadFile] = File(default=None),
    usuario_actual: dict = Depends(verificar_token)
):
    rol = usuario_actual["rol"]
    id_usuario = usuario_actual["id_usuario"]
    if rol not in ("administrador", "instructor", "cuentadante"):
        raise HTTPException(status_code=403, detail="No puedes crear tickets")
    if tipo_salida not in ("dano", "traslado", "prestamo"):
        raise HTTPException(status_code=422, detail="Tipo de salida no válido")
    equipo = session.get(Equipo, id_equipo)
    if equipo is None:
        raise HTTPException(status_code=404, detail="Equipo no encontrado")
    if rol == "cuentadante":
        ambiente = session.get(Ambiente, equipo.id_ambiente)
        if ambiente is None or ambiente.id_cuentadante != id_usuario:
            raise HTTPException(status_code=403, detail="Equipo fuera de tus ambientes")

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
    else:
        estado = session.get(estados_ticket, id_estado) if id_estado is not None else None
        if estado is None:
            raise HTTPException(status_code=422, detail="Selecciona un estado válido")
        if nombre_normalizado(estado.nombre_e) == nombre_normalizado(ESTADO_ENTREGADO):
            raise HTTPException(status_code=409, detail="Primero registra la salida y luego confirma la entrada")

    extension = None
    if imagen and imagen.filename:
        extension = os.path.splitext(imagen.filename)[1].lower()
        if extension not in (".jpg", ".jpeg", ".png"):
            raise HTTPException(status_code=400, detail="Solo se permiten imágenes JPG, JPEG o PNG")
        if imagen.size is not None and imagen.size > 5 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="La imagen supera 5 MB")

    nuevo = tickets(
        motivo=motivo, id_equipo=id_equipo, tipo_salida=tipo_salida,
        id_motivo_novedad=id_motivo_novedad, id_estado=id_estado,
        creado_por=id_usuario, atendido=atendido, fecha_salida=fecha_salida or datetime.now()
    )
    session.add(nuevo)
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
# 🔄 EDITAR TICKET → Si cambia el estado, notifica
# ==========================================
@asis.put("/{id}", response_model=tickets)
async def editar_ticket(
    id: int,
    datos_tik: TicketsEditar,
    session: Sesion_por_rol,
    background_tasks: BackgroundTasks,
    usuario_actual: dict = Depends(verificar_token)
):
    tik_bd = session.exec(
        select(tickets).where(tickets.id_ticket == id).with_for_update()
    ).first()
    if not tik_bd:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El ticket con ID {id} no existe."
        )
    
    estado_anterior = tik_bd.id_estado
    atendido_antes = tik_bd.atendido
    
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

        campos_permitidos = {"id_estado", "atendido"}

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

    if {"id_estado", "atendido", "fecha_retorno"} & tik_dict.keys():
        estado_actual = session.get(estados_ticket, tik_bd.id_estado)
        entregado = nombre_normalizado(ESTADO_ENTREGADO)
        if estado_actual and nombre_normalizado(estado_actual.nombre_e) == entregado:
            raise HTTPException(status_code=409, detail="La entrada de este ticket ya está registrada")
        if "id_estado" in tik_dict:
            id_estado = tik_dict["id_estado"]
            estado_destino = session.get(estados_ticket, id_estado) if id_estado is not None else None
            if estado_destino is None:
                raise HTTPException(status_code=422, detail="Selecciona un estado válido")
            if nombre_normalizado(estado_destino.nombre_e) == entregado:
                raise HTTPException(status_code=409, detail="Usa Registrar entrada para confirmar la devolución")

    # Aplicar únicamente las modificaciones autorizadas.
    tik_bd.sqlmodel_update(tik_dict)
    session.add(tik_bd)
    session.commit()
    session.refresh(tik_bd)
    
    estado_nuevo = tik_bd.id_estado
    se_atendio = tik_bd.atendido and not atendido_antes
    if estado_nuevo != estado_anterior or se_atendio:
        background_tasks.add_task(
            _enviar_notificacion_cambio_estado,
            tik_bd.id_ticket,
            estado_anterior,
            estado_nuevo,
            id_usuario,
            se_atendio,
        )
    
    return tik_bd
# ==========================================
# 🎯 ASIGNAR TÉCNICO (Tickets nuevos)
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
# 🔄 REASIGNAR TÉCNICO (Cambiar de técnico)
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
# 🚫 DESASIGNAR TÉCNICO (Devolver a la cola)
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

@asis.put("/{id}/registrar-entrada", response_model=tickets)
async def registrar_entrada(
    id: int,
    session: Sesion_por_rol,
    background_tasks: BackgroundTasks,
    usuario_actual: dict = Depends(verificar_token)
):
    with session.begin():
        ticket = session.exec(
            consulta_tickets_permitidos(usuario_actual)
            .where(tickets.id_ticket == id)
            .with_for_update(of=tickets)
        ).first()
        if ticket is None:
            raise HTTPException(status_code=404, detail="Ticket no encontrado")

        ambiente_propio = False
        if usuario_actual["rol"] == "cuentadante":
            ambiente_propio = session.exec(
                equipos_del_cuentadante(usuario_actual["id_usuario"])
                .where(Equipo.id_equipo == ticket.id_equipo)
            ).first() is not None
        estado_actual = session.get(estados_ticket, ticket.id_estado)
        restriccion = restringir_entrada(
            ticket, estado_actual.nombre_e if estado_actual else "", usuario_actual, ambiente_propio
        )
        if restriccion:
            raise HTTPException(status_code=restriccion[0], detail=restriccion[1])

        estado_entregado = session.exec(
            select(estados_ticket).where(
                func.lower(func.trim(estados_ticket.nombre_e)) == ESTADO_ENTREGADO.lower()
            ).order_by(estados_ticket.id_estado)
        ).first()
        if estado_entregado is None:
            raise HTTPException(status_code=500, detail="Configura el estado Entregado en ambiente")
        estado_anterior = ticket.id_estado
        ticket.id_estado = estado_entregado.id_estado
        ticket.atendido = True
        ticket.fecha_retorno = datetime.now()
        session.add(ticket)
        session.add(His_ticket(
            id_ticket=id,
            id_usuario=usuario_actual["id_usuario"],
            accion="Registrar entrada de equipo",
            observacion="Equipo devuelto al ambiente",
            estado_resultante=ESTADO_ENTREGADO,
        ))
    session.refresh(ticket)
    background_tasks.add_task(
        _enviar_notificacion_cambio_estado, id, estado_anterior, ticket.id_estado,
        usuario_actual["id_usuario"],
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
    try:
        session.exec(delete(Notificacion).where(Notificacion.id_ticket == id))
        session.delete(tik_bd)
        session.commit()
    except IntegrityError:
        session.rollback()
        raise HTTPException(status_code=409, detail="El ticket tiene historial o asignaciones vinculadas.")
    return tik_bd


# ==========================================
# 📧 FUNCIÓN: NOTIFICAR CREACIÓN DE TICKET
# ==========================================
def _enviar_notificacion_creacion(id_ticket: int):
    try:
        with Session(motor_admin) as sesion:
            ticket = sesion.get(tickets, id_ticket)
            if not ticket:
                print(f"❌ No se encontró el ticket {id_ticket}")
                return
            
            equipo = sesion.get(Equipo, ticket.id_equipo)
            if not equipo:
                print(f"❌ No se encontró el equipo {ticket.id_equipo}")
                return
            
            ambiente = sesion.get(Ambiente, equipo.id_ambiente)
            if not ambiente:
                print(f"❌ No se encontró el ambiente {equipo.id_ambiente}")
                return
            
            creador = sesion.get(Usuario, ticket.creado_por)
            responsables = sesion.exec(
                select(Usuario, Rol.nombre_rol).join(Rol, Usuario.id_rol == Rol.id_rol)
                .where(Rol.nombre_rol.in_(("administrador", "administrador_mesa_ayuda")))
            ).all()
            cuentadante = sesion.get(Usuario, ambiente.id_cuentadante) if ambiente.id_cuentadante else None
            tecnico = sesion.get(Usuario, ticket.asignado_a) if ticket.asignado_a else None
            usuarios_aviso = [usuario for usuario, _ in responsables] + [cuentadante, tecnico]
            avisar_evento_ticket(
                sesion, id_ticket, ticket.creado_por,
                [usuario for usuario in usuarios_aviso
                 if usuario is not None and usuario.id_usuario != ticket.creado_por],
                f"ASIS: se registró el ticket #{id_ticket}. Consulta el detalle en ASIS.",
            )

            mesa = [u for u, rol in responsables if rol == "administrador_mesa_ayuda"]
            destinatarios = list({
                u.correo_u for u in [*mesa, cuentadante, tecnico]
                if u is not None and u.correo_u and u.id_usuario != ticket.creado_por
            })
            
            if not destinatarios:
                print(f"⚠️ No hay correos válidos para el ticket {id_ticket}")
                return
            
            nombre_creador = f"{creador.nombre_u} {creador.apellidos_u}" if creador else "Desconocido"
            nombre_equipo = f"{equipo.nombre} ({equipo.marca})" if equipo.marca else equipo.nombre
            nombre_ambiente = f"{ambiente.nombre_a} - {ambiente.ubicacion}"
            
            datos_email = {
                "id_ticket": ticket.id_ticket,
                "equipo": nombre_equipo,
                "ambiente": nombre_ambiente,
                "motivo": ticket.motivo,
                "creado_por": nombre_creador,
                "fecha_salida": str(ticket.fecha_salida) if ticket.fecha_salida else "N/A"
            }
            
            asunto = f"🚨 Nuevo Ticket #{ticket.id_ticket} - {nombre_equipo}"
            enviar_correo_notificacion(destinatarios, asunto, datos_email)
            
    except Exception as e:
        print(f"❌ Error en notificación de creación: {e}")


# ==========================================
# 📧 FUNCIÓN: NOTIFICAR CAMBIO DE ESTADO
# ==========================================
def _enviar_notificacion_cambio_estado(
    id_ticket: int, estado_anterior: int, estado_nuevo: int, id_autor: int,
    se_atendio: bool = False,
):
    try:
        with Session(motor_admin) as sesion:
            ticket = sesion.get(tickets, id_ticket)
            if not ticket:
                print(f"❌ No se encontró el ticket {id_ticket}")
                return
            
            equipo = sesion.get(Equipo, ticket.id_equipo)
            if not equipo:
                print(f"❌ No se encontró el equipo {ticket.id_equipo}")
                return
            
            ambiente = sesion.get(Ambiente, equipo.id_ambiente)
            if not ambiente:
                print(f"❌ No se encontró el ambiente {equipo.id_ambiente}")
                return
            
            estado_ant = sesion.get(estados_ticket, estado_anterior)
            estado_nue = sesion.get(estados_ticket, estado_nuevo)
            
            nombre_estado_anterior = estado_ant.nombre_e if estado_ant else "Desconocido"
            nombre_estado_nuevo = estado_nue.nombre_e if estado_nue else "Desconocido"
            color_estado_nuevo = estado_nue.color if estado_nue else "#333"
            
            creador = sesion.get(Usuario, ticket.creado_por)
            cuentadante = sesion.get(Usuario, ambiente.id_cuentadante) if ambiente.id_cuentadante else None
            mensaje = (
                f"ASIS: el ticket #{id_ticket} fue atendido."
                if se_atendio
                else f"ASIS: el ticket #{id_ticket} cambió de estado."
            )
            avisar_evento_ticket(sesion, id_ticket, id_autor, [creador, cuentadante], mensaje)
            destinatarios = list({u.correo_u for u in (creador, cuentadante) if u and u.correo_u})
            
            if not destinatarios:
                print(f"⚠️ No hay correos válidos para notificar cambio de estado del ticket {id_ticket}")
                return
            
            nombre_equipo = f"{equipo.nombre} ({equipo.marca})" if equipo.marca else equipo.nombre
            nombre_ambiente = f"{ambiente.nombre_a} - {ambiente.ubicacion}"
            
            datos_email = {
                "id_ticket": ticket.id_ticket,
                "equipo": nombre_equipo,
                "ambiente": nombre_ambiente,
                "estado_anterior": nombre_estado_anterior,
                "estado_nuevo": nombre_estado_nuevo,
                "color_estado": color_estado_nuevo,
                "motivo": ticket.motivo
            }
            
            asunto = f"🔄 Ticket #{ticket.id_ticket} - Estado cambiado a '{nombre_estado_nuevo}'"
            enviar_correo_cambio_estado(destinatarios, asunto, datos_email)
            
    except Exception as e:
        print(f"❌ Error en notificación de cambio de estado: {e}")