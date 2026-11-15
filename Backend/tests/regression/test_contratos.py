"""Regresión de la estructura de la API sin consultar PostgreSQL real."""
import pytest
from fastapi import FastAPI
from enrutadores import ticket, auth, Usuarios, asig_tec


@pytest.mark.regression
def test_rutas_criticas_no_desaparecen():
    app = FastAPI()
    for router in (ticket.asis, auth.asis, Usuarios.asis, asig_tec.asis):
        app.include_router(router)
    rutas = {(metodo, ruta.path) for ruta in app.routes for metodo in getattr(ruta, "methods", set())}
    esperadas = {
        ("POST", "/auth/login"),
        ("GET", "/auth/yo"),
        ("GET", "/tickets/"),
        ("GET", "/tickets/{id}"),
        ("POST", "/tickets/"),
        ("PUT", "/tickets/{id}"),
        ("POST", "/asignacion/tomar/{id_ticket}"),
        ("POST", "/usuarios/"),
    }
    assert esperadas.issubset(rutas), f"Faltan rutas: {esperadas - rutas}"


@pytest.mark.regression
def test_el_esquema_de_lectura_de_usuario_no_expone_hash():
    from Modelos.Usuarios import UsuarioLeer
    assert "contrasena_u" not in UsuarioLeer.model_fields
