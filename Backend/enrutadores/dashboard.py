from fastapi import APIRouter, HTTPException
from sqlmodel import text
from conexion_db import Sesion_dependencia

asis = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


@asis.get("/tickets-por-mes")
async def tickets_por_mes(sesion: Sesion_dependencia):
    resultado = sesion.exec(
        text("SELECT mes, total_tickets FROM vista_tickets_por_mes")
    ).all()
    return [{"mes": str(r[0]), "total_tickets": r[1]} for r in resultado]


@asis.get("/tickets-por-estado")
async def tickets_por_estado(sesion: Sesion_dependencia):
    resultado = sesion.exec(
        text("SELECT estado, color, total FROM vista_tickets_por_estado")
    ).all()
    return [{"estado": r[0], "color": r[1], "total": r[2]} for r in resultado]


@asis.get("/danos-por-ambiente")
async def danos_por_ambiente(sesion: Sesion_dependencia):
    resultado = sesion.exec(
        text("SELECT ambiente, id_ambiente, total_tickets FROM vista_danos_por_ambiente")
    ).all()
    return [{"ambiente": r[0], "id_ambiente": r[1], "total_tickets": r[2]} for r in resultado]


@asis.get("/motivos-novedad")
async def motivos_novedad(sesion: Sesion_dependencia):
    resultado = sesion.exec(
        text("SELECT motivo, total FROM vista_motivos_novedad")
    ).all()
    return [{"motivo": r[0], "total": r[1]} for r in resultado]


@asis.get("/tickets-por-tipo")
async def tickets_por_tipo(sesion: Sesion_dependencia):
    resultado = sesion.exec(
        text("SELECT tipo, total FROM vista_tickets_por_tipo")
    ).all()
    return [{"tipo": r[0], "total": r[1]} for r in resultado]


@asis.get("/historial-equipo/{serial}")
async def historial_equipo(serial: str, sesion: Sesion_dependencia):
    resultado = sesion.exec(
        text("""
            SELECT serial, equipo, codigo, motivo, fecha,
            accion, observacion, estado_resultante, realizado_por
            FROM vista_historial_equipo
            WHERE serial = :serial
        """),
        params={"serial": serial}
    ).all()

    if not resultado:
        raise HTTPException(
            status_code=404,
            detail=f"No se encontró ningún equipo con serial {serial}"
        )

    return [
        {
            "serial": r[0],
            "equipo": r[1],
            "codigo": r[2],
            "motivo": r[3],
            "fecha": str(r[4]),
            "accion": r[5],
            "observacion": r[6],
            "estado_resultante": r[7],
            "realizado_por": r[8]
        }
        for r in resultado
    ]


@asis.get("/historial-usuario/{id_usuario}")
async def historial_usuario(id_usuario: int, sesion: Sesion_dependencia):
    resultado = sesion.exec(
        text("""
            SELECT id_usuario, nombre_u, apellidos_u, fecha,
            accion, observacion, estado_resultante,
            motivo, equipo, codigo
            FROM vista_historial_usuario
            WHERE id_usuario = :id_usuario
        """),
        params={"id_usuario": id_usuario}
    ).all()

    if not resultado:
        raise HTTPException(
            status_code=404,
            detail=f"No se encontró historial para el usuario {id_usuario}"
        )

    return [
        {
            "id_usuario": r[0],
            "nombre": r[1],
            "apellidos": r[2],
            "fecha": str(r[3]),
            "accion": r[4],
            "observacion": r[5],
            "estado_resultante": r[6],
            "motivo": r[7],
            "equipo": r[8],
            "codigo": r[9]
        }
        for r in resultado
    ]