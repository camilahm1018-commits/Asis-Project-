from fastapi import (APIRouter, HTTPException, status, BackgroundTasks, UploadFile, File, Form)
from Modelos.tickets import tickets, TicketsCrear, TicketsEditar
from Modelos.equipos import Equipo
from Modelos.ambientes import Ambiente
from Modelos.Usuarios import Usuario
from Modelos.roles import Rol
from conexion_db import Sesion_dependencia, motor_bd
from sqlmodel import Session, select
from servicios.correo import enviar_correo_notificacion
import os
import shutil
from typing import Optional
from datetime import datetime

asis = APIRouter(
    prefix="/tickets",
    tags=["Tickets"]
)

@asis.get("/", response_model=list[tickets])
async def listar_tickets(session: Sesion_dependencia):
    listTi = session.exec(select(tickets)).all()
    return listTi

@asis.get("/{id}", response_model=tickets)
async def listar_tickets_id(id: int, session: Sesion_dependencia):
    tik_bd = session.get(tickets, id)
    if not tik_bd:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El ticket con ID {id} no existe."
        )
    return tik_bd


@asis.post("/", response_model=tickets)
async def crear_ticket(
    motivo: str = Form(...),
    id_equipo: int = Form(...),
    tipo_salida: str = Form(...),
    id_motivo_novedad: Optional[int] = Form(default=None),
    id_estado: int = Form(...),
    creado_por: int = Form(...),
    atendido: bool = Form(False),
    fecha_salida: Optional[datetime] = Form(default=None),
    imagen: Optional[UploadFile] = File(default=None),
    session: Sesion_dependencia = None,
    background_tasks: BackgroundTasks = None
):

    # ==========================================
    # 1. Crear el ticket sin imagen inicialmente
    # ==========================================

    tik_validado = tickets(
        motivo=motivo,
        id_equipo=id_equipo,
        tipo_salida=tipo_salida,
        id_motivo_novedad=id_motivo_novedad,
        id_estado=id_estado,
        creado_por=creado_por,
        atendido=atendido,
        fecha_salida=fecha_salida
    )

    session.add(tik_validado)
    session.commit()
    session.refresh(tik_validado)

    # ==========================================
    # 2. Guardar imagen si el usuario adjuntó una
    # ==========================================

    if imagen and imagen.filename:

        # Extensiones permitidas
        extensiones_permitidas = {
            ".jpg",
            ".jpeg",
            ".png"
        }

        extension = os.path.splitext(imagen.filename)[1].lower()

        if extension not in extensiones_permitidas:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Solo se permiten imágenes JPG, JPEG o PNG."
            )

        # Crear carpeta si no existe
        carpeta = "uploads/tickets"

        os.makedirs(carpeta, exist_ok=True)

        # Nombre único usando el ID del ticket
        nombre_archivo = f"ticket_{tik_validado.id_ticket}{extension}"

        ruta_archivo = os.path.join(
            carpeta,
            nombre_archivo
        )

        # Guardar archivo
        with open(ruta_archivo, "wb") as archivo:
            shutil.copyfileobj(
                imagen.file,
                archivo
            )

        # Guardar ruta en la BD
        tik_validado.imagen = ruta_archivo

        session.add(tik_validado)
        session.commit()
        session.refresh(tik_validado)

    # ==========================================
    # 3. Enviar notificación por correo
    # ==========================================

    background_tasks.add_task(
        _enviar_notificacion_ticket,
        tik_validado.id_ticket
    )

    return tik_validado



@asis.put("/{id}", response_model=tickets)
async def editar_ticket(id: int, datos_tik: TicketsEditar, session: Sesion_dependencia):
    tik_bd = session.get(tickets, id)
    if not tik_bd:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El ticket con ID {id} no existe."
        )
    tik_dict = datos_tik.model_dump(exclude_unset=True)
    tik_bd.sqlmodel_update(tik_dict)
    session.add(tik_bd)
    session.commit()
    session.refresh(tik_bd)
    return tik_bd

@asis.delete("/{id}", response_model=tickets)
async def eliminar_ticket(id: int, session: Sesion_dependencia):
    tik_bd = session.get(tickets, id)
    if not tik_bd:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El ticket con ID {id} no existe."
        )
    session.delete(tik_bd)
    session.commit()
    return tik_bd


# ==========================================
# FUNCIÓN EN SEGUNDO PLANO PARA NOTIFICACIONES
# ==========================================
def _enviar_notificacion_ticket(id_ticket: int):
    """
    Busca los correos reales en la BD según:
    - Cuentadante del ambiente del equipo
    - Todos los administradores de mesa de ayuda
    - Todos los técnicos registrados
    - Técnico asignado específicamente al ticket (si ya hay uno)
    """
    try:
        with Session(motor_bd) as sesion:
            # 1. Obtener el ticket
            ticket = sesion.get(tickets, id_ticket)
            if not ticket:
                print(f"❌ No se encontró el ticket {id_ticket}")
                return
            
            # 2. Obtener el equipo
            equipo = sesion.get(Equipo, ticket.id_equipo)
            if not equipo:
                print(f"❌ No se encontró el equipo {ticket.id_equipo}")
                return
            
            # 3. Obtener el ambiente del equipo
            ambiente = sesion.get(Ambiente, equipo.id_ambiente)
            if not ambiente:
                print(f"❌ No se encontró el ambiente {equipo.id_ambiente}")
                return
            
            # 4. Obtener el usuario que creó el ticket
            creador = sesion.get(Usuario, ticket.creado_por)
            
            # ==========================================
            # 🎯 RECOLECTAR CORREOS DE LA BASE DE DATOS
            # ==========================================
            destinatarios = []
            
            # 4.1 Cuentadante del ambiente
            if ambiente.id_cuentadante:
                cuentadante = sesion.get(Usuario, ambiente.id_cuentadante)
                if cuentadante and cuentadante.correo_u:
                    destinatarios.append(cuentadante.correo_u)
                    print(f"📧 Cuentadante: {cuentadante.correo_u}")
            
            # 4.2 Todos los administradores de mesa de ayuda
            admins = sesion.exec(
                select(Usuario).join(Rol, Usuario.id_rol == Rol.id_rol)
                .where(Rol.nombre_rol == "administrador_mesa_ayuda")
            ).all()
            for admin in admins:
                if admin.correo_u:
                    destinatarios.append(admin.correo_u)
                    print(f"📧 Admin mesa ayuda: {admin.correo_u}")
            
            # 4.3 Todos los técnicos registrados
            tecnicos = sesion.exec(
                select(Usuario).join(Rol, Usuario.id_rol == Rol.id_rol)
                .where(Rol.nombre_rol == "tecnico")
            ).all()
            for tecnico in tecnicos:
                if tecnico.correo_u:
                    destinatarios.append(tecnico.correo_u)
                    print(f"📧 Técnico: {tecnico.correo_u}")
            
            # 4.4 Técnico asignado específicamente al ticket (si ya hay uno)
            if ticket.asignado_a:
                tecnico_asignado = sesion.get(Usuario, ticket.asignado_a)
                if tecnico_asignado and tecnico_asignado.correo_u:
                    destinatarios.append(tecnico_asignado.correo_u)
                    print(f"📧 Técnico asignado: {tecnico_asignado.correo_u}")
            
            # 5. Eliminar duplicados
            destinatarios = list(set(destinatarios))
            
            # 6. Quitar el correo del creador (no se notifica a sí mismo)
            if creador and creador.correo_u in destinatarios:
                destinatarios.remove(creador.correo_u)
            
            if not destinatarios:
                print(f"⚠️ No hay correos válidos para notificar del ticket {id_ticket}")
                return
            
            # 7. Preparar datos para el correo
            nombre_creador = f"{creador.nombre_u} {creador.apellidos_u}" if creador else "Desconocido"
            nombre_equipo = f"{equipo.nombre} ({equipo.marca})" if equipo.marca else equipo.nombre
            nombre_ambiente = f"{ambiente.nombre_a} - {ambiente.ubicacion}"
            
            datos_email = {
                "id_ticket": ticket.id_ticket,
                "tipo_salida": ticket.tipo_salida or "N/A",
                "equipo": nombre_equipo,
                "ambiente": nombre_ambiente,
                "motivo": ticket.motivo,
                "creado_por": nombre_creador,
                "fecha_salida": str(ticket.fecha_salida) if ticket.fecha_salida else "N/A"
            }
            
            asunto = f"🚨 Nuevo Ticket #{ticket.id_ticket} - {nombre_equipo}"
            
            # 8. Enviar el correo
            enviar_correo_notificacion(destinatarios, asunto, datos_email)
            
    except Exception as e:
        print(f"❌ Error en _enviar_notificacion_ticket: {e}")