"""Contrato público de seguridad y errores, sin DB de producción."""
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from enrutadores import ticket, asig_tec, Usuarios, auth

@pytest.mark.regression
@pytest.mark.parametrize('metodo,ruta', [
    ('GET', '/tickets/'),
    ('GET', '/tickets/1'),
    ('POST', '/tickets/'),
    ('PUT', '/tickets/1'),
    ('DELETE', '/tickets/1'),
    ('POST', '/asignacion/tomar/1'),
    ('GET', '/usuarios/'),
])
def test_endpoint_privado_sin_bearer_retorna_401(metodo, ruta):
    app = FastAPI()
    for router in (ticket.asis, asig_tec.asis, Usuarios.asis, auth.asis):
        app.include_router(router)
    cliente = TestClient(app)
    respuesta = cliente.request(metodo, ruta)
    assert respuesta.status_code == 401, respuesta.text
    cliente.close()

@pytest.mark.regression
def test_documentacion_openapi_contiene_esquema_bearer():
    app = FastAPI()
    app.include_router(ticket.asis)
    seguridad = app.openapi()['components']['securitySchemes']
    assert any(x.get('type') == 'oauth2' for x in seguridad.values())
