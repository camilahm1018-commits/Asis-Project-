"""Regresión de la estructura de la API sin consultar PostgreSQL real."""
import pytest
from fastapi import FastAPI
from enrutadores import ER_ambientes, Usuarios, asig_tec, auth, notificaciones, ticket


@pytest.mark.regression
def test_rutas_criticas_no_desaparecen():
    app = FastAPI()
    for router in (ticket.asis, auth.asis, Usuarios.asis, asig_tec.asis, ER_ambientes.asis, notificaciones.asis):
        app.include_router(router)
    rutas = {
        (metodo.upper(), path)
        for path, operaciones in app.openapi()["paths"].items()
        for metodo in operaciones
    }
    esperadas = {
        ("POST", "/auth/login"),
        ("GET", "/auth/yo"),
        ("GET", "/tickets/"),
        ("GET", "/tickets/{id}"),
        ("POST", "/tickets/"),
        ("PUT", "/tickets/{id}"),
        ("POST", "/asignacion/tomar/{id_ticket}"),
        ("POST", "/usuarios/"),
        ("POST", "/usuarios/pre-registrar"),
        ("PUT", "/usuarios/{id_usuario}"),
        ("DELETE", "/usuarios/{id_usuario}"),
        ("POST", "/auth/confirmar-datos"),
        ("POST", "/auth/activar-cuenta"),
        ("GET", "/ambientes/"),
        ("PUT", "/ambientes/{id_ambiente}"),
        ("GET", "/notificaciones/usuario/{id_usuario}"),
        ("PUT", "/notificaciones/marcar-leida/{id_notificacion}"),
    }
    assert esperadas.issubset(rutas), f"Faltan rutas: {esperadas - rutas}"


@pytest.mark.regression
def test_el_esquema_de_lectura_de_usuario_no_expone_hash():
    from Modelos.Usuarios import UsuarioLeer
    assert "contrasena_u" not in UsuarioLeer.model_fields
