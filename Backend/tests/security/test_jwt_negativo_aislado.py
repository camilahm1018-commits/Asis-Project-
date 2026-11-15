"""Tokens inválidos: la API debe responder 401 sin consultar BD real."""
from datetime import datetime, timedelta, timezone
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from jose import jwt
from enrutadores.auth import asis as auth_router
from seguridad import CLAVE_SECRETA, ALGORITMO

@pytest.fixture
def auth_cliente_sin_overrides():
    api = FastAPI()  # No usamos lifespan de la aplicación principal
    api.include_router(auth_router)
    with TestClient(api) as cliente:
        yield cliente


def test_sin_token_no_ve_perfil(auth_cliente_sin_overrides):
    assert auth_cliente_sin_overrides.get('/auth/yo').status_code == 401


@pytest.mark.parametrize('token', [
    'texto-sin-formato-jwt',
    'a.b.c',
    'eyJhbGciOiJub25lIn0.eyJpZF91c3VhcmlvIjoxfQ.',
])
def test_token_invalido_rechazado(auth_cliente_sin_overrides, token):
    r = auth_cliente_sin_overrides.get('/auth/yo', headers={'Authorization': f'Bearer {token}'})
    assert r.status_code == 401
    assert 'Traceback' not in r.text


def test_token_expirado_rechazado(auth_cliente_sin_overrides):
    pasado = datetime.now(timezone.utc) - timedelta(minutes=1)
    token = jwt.encode({'id_usuario': 10, 'tipo': 'acceso', 'exp': pasado}, CLAVE_SECRETA, algorithm=ALGORITMO)
    r = auth_cliente_sin_overrides.get('/auth/yo', headers={'Authorization': f'Bearer {token}'})
    assert r.status_code == 401


def test_token_de_recuperacion_no_es_token_de_acceso(auth_cliente_sin_overrides):
    futuro = datetime.now(timezone.utc) + timedelta(minutes=10)
    token = jwt.encode({'id_usuario': 10, 'proposito': 'recuperacion', 'exp': futuro}, CLAVE_SECRETA, algorithm=ALGORITMO)
    r = auth_cliente_sin_overrides.get('/auth/yo', headers={'Authorization': f'Bearer {token}'})
    assert r.status_code == 401


def test_token_firmado_con_clave_equivocada(auth_cliente_sin_overrides):
    futuro = datetime.now(timezone.utc) + timedelta(minutes=10)
    token = jwt.encode({'id_usuario': 10, 'tipo': 'acceso', 'exp': futuro}, 'clave-distinta-exclusiva-para-qa-0123456789', algorithm=ALGORITMO)
    r = auth_cliente_sin_overrides.get('/auth/yo', headers={'Authorization': f'Bearer {token}'})
    assert r.status_code == 401
