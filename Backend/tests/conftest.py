"""Pruebas aisladas de ASIS: NUNCA escriben en la base PostgreSQL real.

La sesión de integración es SQLite en memoria. Se usan los routers reales,
pero sus dependencias de auth y BD se sustituyen en un FastAPI de prueba.
"""
import os
import sys
from pathlib import Path

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy.pool import StaticPool
from sqlmodel import SQLModel, Session, create_engine

BACKEND = Path(__file__).resolve().parents[1]
if str(BACKEND) not in sys.path:
    sys.path.insert(0, str(BACKEND))

# Solo son valores de prueba; create_engine no abre conexión Postgres aquí.
os.environ.setdefault("DATABASE_URL", "postgresql+psycopg2://postgres:qa@127.0.0.1:5544/asis_qa_no_usar")
for key in (
    "ASIS_DB_AUTH_PASSWORD", "ASIS_DB_ADMIN_PASSWORD", "ASIS_DB_INSTRUCTOR_PASSWORD",
    "ASIS_DB_TECNICO_PASSWORD", "ASIS_DB_MESA_PASSWORD", "ASIS_DB_CUENTADANTE_PASSWORD",
):
    os.environ.setdefault(key, "qa-no-es-una-contrasena-real")
os.environ.setdefault("ASIS_JWT_SECRET", "qa-solo-pruebas-no-usar-para-produccion-0123456789")

# Importar el modelo completo, para registrar también las relaciones del ORM.
from Modelos import (  # noqa: E402, F401
    Usuarios, ambientes, equipos, tipo_equipo, tipo_documento, roles, tickets,
    estados_ticket, asig_tec, His_tickets, motivo_novedad, notificaciones,
)
from Modelos.Usuarios import Usuario  # noqa: E402
from Modelos.ambientes import Ambiente  # noqa: E402
from Modelos.equipos import Equipo  # noqa: E402
from Modelos.estados_ticket import estados_ticket  # noqa: E402
from Modelos.roles import Rol  # noqa: E402
from Modelos.tipo_documento import Tipo_identificacion  # noqa: E402
from Modelos.tipo_equipo import TipoEquipo  # noqa: E402
from Modelos.tickets import tickets  # noqa: E402
from enrutadores import auth, ticket  # noqa: E402
from seguridad import verificar_token  # noqa: E402
from sesiones_roles import obtener_sesion_por_rol  # noqa: E402


@pytest.fixture
def engine_qa():
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    SQLModel.metadata.create_all(engine)
    with Session(engine) as sesion:
        sesion.add_all([
            Rol(id_rol=1, nombre_rol="instructor"),
            Rol(id_rol=2, nombre_rol="tecnico"),
            Rol(id_rol=3, nombre_rol="administrador"),
            Rol(id_rol=4, nombre_rol="cuentadante"),
            Rol(id_rol=5, nombre_rol="administrador_mesa_ayuda"),
            Tipo_identificacion(id_tipo_id=1, iniciales="CC", nombre_tipo="Cédula"),
            TipoEquipo(id_tipo=1, nombre_t="Computador"),
            estados_ticket(id_estado=1, nombre_e="Pendiente", color="#FFCC00"),
            estados_ticket(id_estado=2, nombre_e="Resuelto", color="#00AA00"),
        ])
        for id_, rol in ((10, 1), (20, 1), (30, 2), (40, 4), (41, 4), (50, 3)):
            sesion.add(Usuario(
                id_usuario=id_, nombre_u="Prueba", apellidos_u=str(id_),
                correo_u=f"qa{id_}@example.test", contrasena_u="no-iniciar-sesion-con-esto",
                numero_documento=f"QA{id_}", telefono_u="000", id_rol=rol,
                id_tipo_identificacion=1, activo=True,
            ))
        sesion.flush()
        sesion.add_all([
            Ambiente(id_ambiente=101, nombre_a="Aula A", ubicacion="A", id_cuentadante=40),
            Ambiente(id_ambiente=102, nombre_a="Aula B", ubicacion="B", id_cuentadante=41),
        ])
        sesion.flush()
        sesion.add_all([
            Equipo(id_equipo=1, codigo="QA-1", nombre="PC A", estado="activo", id_ambiente=101, id_tipo=1),
            Equipo(id_equipo=2, codigo="QA-2", nombre="PC B", estado="activo", id_ambiente=102, id_tipo=1),
        ])
        sesion.flush()
        sesion.add_all([
            tickets(id_ticket=1, motivo="A", id_equipo=1, creado_por=10,
                    asignado_a=None, id_estado=1, atendido=False, tipo_salida="dano"),
            tickets(id_ticket=2, motivo="B", id_equipo=2, creado_por=20,
                    asignado_a=30, id_estado=1, atendido=False, tipo_salida="dano"),
            tickets(id_ticket=3, motivo="C", id_equipo=2, creado_por=20,
                    asignado_a=None, id_estado=2, atendido=True, tipo_salida="dano"),
            tickets(id_ticket=4, motivo="D", id_equipo=1, creado_por=41,
                    asignado_a=30, id_estado=2, atendido=True, tipo_salida="dano"),
        ])
        sesion.commit()
    try:
        yield engine
    finally:
        engine.dispose()


@pytest.fixture
def cliente_qa(engine_qa):
    """Devuelve (TestClient, cambiar_rol). No ejecuta startup/lifespan ni correo real."""
    app = FastAPI()
    app.include_router(ticket.asis)
    app.include_router(auth.asis)
    usuario = {"id_usuario": 50, "rol": "administrador"}

    def auth_override():
        return dict(usuario)

    def sesion_override():
        with Session(engine_qa) as sesion:
            yield sesion

    app.dependency_overrides[verificar_token] = auth_override
    app.dependency_overrides[obtener_sesion_por_rol] = sesion_override

    def cambiar_rol(id_usuario, rol):
        usuario.update(id_usuario=id_usuario, rol=rol)

    # NO hacer 'with TestClient(...)': así no ejecutamos lifespan/bootstrap_admin.
    cliente = TestClient(app)
    yield cliente, cambiar_rol
    app.dependency_overrides.clear()
    cliente.close()
