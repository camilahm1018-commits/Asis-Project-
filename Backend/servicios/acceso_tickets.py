"""Política única de visibilidad de tickets; FastAPI y PostgreSQL se complementan."""
from unicodedata import normalize

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


ESTADO_ENTREGADO = "Entregado en ambiente"


def nombre_normalizado(valor: str | None) -> str:
    return "".join(
        letra for letra in normalize("NFD", (valor or "").strip().casefold())
        if not "\u0300" <= letra <= "\u036f"
    )


def equipos_del_cuentadante(id_usuario: int):
    return (
        select(Equipo.id_equipo)
        .join(Ambiente, Equipo.id_ambiente == Ambiente.id_ambiente)
        .where(Ambiente.id_cuentadante == id_usuario)
    )


def restringir_entrada(ticket: tickets, estado: str, usuario: dict, ambiente_propio: bool = False):
    """Devuelve (HTTP, detalle) si todavía no se puede registrar la entrada."""
    rol = usuario["rol"]
    id_usuario = usuario["id_usuario"]
    tipo = nombre_normalizado(ticket.tipo_salida)

    if tipo in ("", "dano"):
        if rol != "administrador_mesa_ayuda" and (
            rol != "tecnico" or ticket.asignado_a != id_usuario
        ):
            return 403, "Solo Mesa de Ayuda o el técnico asignado pueden registrar esta entrada"
        estados_permitidos = {"reparado", "resuelto"}
        mensaje = "El ticket debe estar reparado para registrar la entrada"
    elif tipo == "prestamo":
        if not ((rol == "instructor" and ticket.creado_por == id_usuario)
                or (rol == "cuentadante" and ambiente_propio)):
            return 403, "Solo el instructor que registró el préstamo o el cuentadante del ambiente pueden registrar esta entrada"
        estados_permitidos = {"trasladado", "prestado", "en prestamo"}
        mensaje = "El préstamo debe estar pendiente de devolución"
    else:
        return 409, "Este tipo de salida no admite registro de entrada"

    nombre_estado = nombre_normalizado(estado)
    if nombre_estado == nombre_normalizado(ESTADO_ENTREGADO):
        return 409, "Ya se registró la entrada de este equipo"
    if nombre_estado not in estados_permitidos or (tipo == "prestamo" and ticket.atendido):
        return 409, mensaje
    return None
