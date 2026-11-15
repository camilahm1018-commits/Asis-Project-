"""Pruebas de seguridad HTTP contra ASIS YA encendido, solo localhost.
Se habilitan explícitamente con ASIS_SEC_BASE_URL y ASIS_SEC_ALLOW_LOCAL=YES.
Los intentos de login usan usuarios inexistentes y no modifican tablas.
"""
import os
from urllib.parse import urlsplit, quote
import httpx
import pytest

# Exclusión automática de la ejecución habitual; ejecutar solo de forma explícita.
pytestmark = pytest.mark.live

PAYLOADS = [
    "' OR '1'='1' --",
    "' UNION SELECT NULL --",
    '" OR "1"="1" --',
    "nobody@example.test' --",
]

@pytest.fixture(scope='module')
def cliente_local():
    target = os.getenv('ASIS_SEC_BASE_URL', '').rstrip('/')
    if not target or os.getenv('ASIS_SEC_ALLOW_LOCAL', '').upper() != 'YES':
        pytest.skip('Pruebas live desactivadas: definir ASIS_SEC_BASE_URL y ASIS_SEC_ALLOW_LOCAL=YES')
    url = urlsplit(target)
    if url.scheme not in ('http', 'https') or url.hostname not in ('127.0.0.1', 'localhost', '::1'):
        pytest.fail('Seguridad: estas pruebas solo aceptan localhost/127.0.0.1/::1')
    if url.username or url.password or url.path not in ('', '/'):
        pytest.fail('La URL base no debe incluir usuario, contraseña ni ruta')
    with httpx.Client(base_url=target, timeout=8, follow_redirects=False, trust_env=False) as cliente:
        yield cliente


def test_api_lista_para_pruebas(cliente_local):
    r = cliente_local.get('/openapi.json')
    assert r.status_code == 200, f'La API no responde: HTTP {r.status_code}'
    assert r.json().get('info', {}).get('title') == 'ASIS API'


@pytest.mark.parametrize('entrada', PAYLOADS)
def test_sqli_login_local_no_logra_acceso(cliente_local, entrada):
    r = cliente_local.post('/auth/login', data={
        'username': entrada, 'password': 'credencial-incorrecta-qa'
    })
    assert r.status_code == 401, f'Posible hallazgo SQLi o error interno: HTTP {r.status_code}'
    assert 'access_token' not in r.text
    assert all(texto not in r.text.lower() for texto in ('traceback', 'psycopg2', 'sqlalchemy.exc'))


@pytest.mark.parametrize('ruta', ['/auth/yo', '/tickets/', '/usuarios/'])
def test_sin_token_denegado(cliente_local, ruta):
    r = cliente_local.get(ruta)
    assert r.status_code == 401


def test_bearer_falso_denegado(cliente_local):
    r = cliente_local.get('/auth/yo', headers={'Authorization': 'Bearer esto.no.es.un.jwt'})
    assert r.status_code == 401


def test_ruta_con_id_inyectado_y_token_invalido_no_accede(cliente_local):
    # Con token inválido, la respuesta será 401 o 422 según el orden de FastAPI.
    r = cliente_local.get('/tickets/' + quote("1' OR '1'='1", safe=''),
                          headers={'Authorization': 'Bearer inválido'})
    assert r.status_code in (401, 403, 404, 422)
    assert all(texto not in r.text.lower() for texto in ('traceback', 'psycopg2'))
