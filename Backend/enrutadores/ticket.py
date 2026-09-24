from fastapi import APIRouter, HTTPException, status, BackgroundTasks, UploadFile, File, Form
from Modelos.tickets import tickets, TicketsEditar
from Modelos.equipos import Equipo
from Modelos.ambientes import Ambiente
from Modelos.Usuarios import Usuario
from Modelos.roles import Rol
from Modelos.estados_ticket import estados_ticket
from conexion_db import Sesion_dependencia, motor_bd
from sqlmodel import Session, select
from servicios.correo import enviar_correo_notificacion, enviar_correo_cambio_estado
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
    return session.exec(select(tickets)).all()

@asis.get("/{id}", response_model=tickets)
async def listar_tickets_id(id: int, session: Sesion_dependencia):
    tik_bd = session.get(tickets, id)
    if not tik_bd:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El ticket con ID {id} no existe."
        )
    return tik_bd


# ==========================================
# 🎫 CREAR TICKET → Con soporte para imagen y notificaciones
# ==========================================

@asis.post("/", response_model=tickets)
async def crear_ticket(
    session: Sesion_dependencia,
    background_tasks: BackgroundTasks,
    motivo: str = Form(...),
    id_equipo: int = Form(...),
    tipo_salida: str = Form(...),
    id_motivo_novedad: Optional[int] = Form(default=None),
    id_estado: int = Form(...),
    creado_por: int = Form(...),
    atendido: bool = Form(False),
    fecha_salida: Optional[datetime] = Form(default=None),
    imagen: Optional[UploadFile] = File(default=None),
):
    # 1. Crear el ticket sin imagen inicialmente
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

    # 2. Guardar imagen si el usuario adjuntó una
    if imagen and imagen.filename:
        extensiones_permitidas = {".jpg", ".jpeg", ".png"}
        extension = os.path.splitext(imagen.filename)[1].lower()

        if extension not in extensiones_permitidas:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Solo se permiten imágenes JPG, JPEG o PNG."
            )

        carpeta = "uploads/tickets"
        os.makedirs(carpeta, exist_ok=True)

        nombre_archivo = f"ticket_{tik_validado.id_ticket}{extension}"
        ruta_archivo = os.path.join(carpeta, nombre_archivo)

        with open(ruta_archivo, "wb") as archivo:
            shutil.copyfileobj(imagen.file, archivo)

        # Guardar ruta en la BD
        tik_validado.imagen = ruta_archivo
        session.add(tik_validado)
        session.commit()
        session.refresh(tik_validado)

    # 3. Enviar notificación por correo en segundo plano
    background_tasks.add_task(
        _enviar_notificacion_creacion,
        tik_validado.id_ticket
    )

    return tik_validado

# ==========================================
# 🔄 EDITAR TICKET → Si cambia el estado, notifica
# ==========================================
@asis.put("/{id}", response_model=tickets)
async def editar_ticket(
    id: int,
    datos_tik: TicketsEditar,
    session: Sesion_dependencia,
    background_tasks: BackgroundTasks
):
    tik_bd = session.get(tickets, id)
    if not tik_bd:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El ticket con ID {id} no existe."
        )
    
    estado_anterior = tik_bd.id_estado
    
    tik_dict = datos_tik.model_dump(exclude_unset=True)
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
# 📧 FUNCIÓN: NOTIFICAR CREACIÓN DE TICKET
# ==========================================
def _enviar_notificacion_creacion(id_ticket: int):
    try:
        with Session(motor_bd) as sesion:
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
            destinatarios = []
            
            if ambiente.id_cuentadante:
                cuentadante = sesion.get(Usuario, ambiente.id_cuentadante)
                if cuentadante and cuentadante.correo_u:
                    destinatarios.append(cuentadante.correo_u)
            
            admins = sesion.exec(
                select(Usuario).join(Rol, Usuario.id_rol == Rol.id_rol)
                .where(Rol.nombre_rol == "administrador_mesa_ayuda")
            ).all()
            for admin in admins:
                if admin.correo_u:
                    destinatarios.append(admin.correo_u)
            
            tecnicos = sesion.exec(
                select(Usuario).join(Rol, Usuario.id_rol == Rol.id_rol)
                .where(Rol.nombre_rol == "tecnico")
            ).all()
            for tecnico in tecnicos:
                if tecnico.correo_u:
                    destinatarios.append(tecnico.correo_u)
            
            if ticket.asignado_a:
                tec_asignado = sesion.get(Usuario, ticket.asignado_a)
                if tec_asignado and tec_asignado.correo_u:
                    destinatarios.append(tec_asignado.correo_u)
            
            destinatarios = list(set(destinatarios))
            
            if creador and creador.correo_u in destinatarios:
                destinatarios.remove(creador.correo_u)
            
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
def _enviar_notificacion_cambio_estado(id_ticket: int, estado_anterior: int, estado_nuevo: int):
    try:
        with Session(motor_bd) as sesion:
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
            destinatarios = []
            
            if ambiente.id_cuentadante:
                cuentadante = sesion.get(Usuario, ambiente.id_cuentadante)
                if cuentadante and cuentadante.correo_u:
                    destinatarios.append(cuentadante.correo_u)
            
            if creador and creador.correo_u:
                destinatarios.append(creador.correo_u)
            
            destinatarios = list(set(destinatarios))
            
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