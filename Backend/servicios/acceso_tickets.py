"""Política única de visibilidad de tickets; FastAPI y PostgreSQL se complementan."""
from fastapi import HTTPException
from sqlalchemy import or_
from sqlmodel import select
from Modelos.tickets import tickets
from Modelos.equipos import Equipo
from Modelos.ambientes import Ambiente


def consulta_tickets_permitidos(usuario: dict):
    rol, id_usuario = usuario["rol"], usuario["id_usuario"]
    q = select(tickets)
    if rol in ("administrador", "administrador_mesa_ayuda"):
        return q
    if rol == "tecnico":
        return q.where(or_(
            tickets.asignado_a == id_usuario,
            (tickets.asignado_a.is_(None)) & (tickets.atendido.is_(False))
        ))
    if rol == "instructor":
        return q.where(tickets.creado_por == id_usuario)
    if rol == "cuentadante":
        return (q.join(Equipo, tickets.id_equipo == Equipo.id_equipo)
                .join(Ambiente, Equipo.id_ambiente == Ambiente.id_ambiente)
                .where(or_(tickets.creado_por == id_usuario,
                           Ambiente.id_cuentadante == id_usuario)))
    raise HTTPException(status_code=403, detail="Perfil no autorizado")


def puede_ver_ticket(sesion, usuario: dict, id_ticket: int):
    return sesion.exec(
        consulta_tickets_permitidos(usuario).where(tickets.id_ticket == id_ticket)
    ).first() is not None
