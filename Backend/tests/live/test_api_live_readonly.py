"""Solo lectura HTTP contra ASIS ejecutándose. Opt-in: ASIS_QA_LIVE=SI."""
import os
from urllib.parse import urlparse
import httpx
import pytest

pytestmark=pytest.mark.live

@pytest.fixture(scope='module')
def qa_api():
    if os.getenv('ASIS_QA_LIVE') != 'SI':
        pytest.skip('Se necesita ASIS_QA_LIVE=SI para llamadas a servicios reales')
    url=os.getenv('ASIS_QA_API_URL', 'http://127.0.0.1:8000').rstrip('/')
    host=urlparse(url).hostname
    if host not in ('127.0.0.1', 'localhost', '::1') and os.getenv('ASIS_QA_PERMITIR_REMOTO') != 'SI':
        pytest.skip('API remota deshabilitada: ASIS_QA_PERMITIR_REMOTO=SI en QA autorizada')
    yield url


def test_openapi_responde_y_tiene_tickets(qa_api):
    response=httpx.get(f'{qa_api}/openapi.json', timeout=10)
    response.raise_for_status()
    assert '/tickets/' in response.json()['paths']


def test_no_autenticado_no_lista_tickets(qa_api):
    response=httpx.get(f'{qa_api}/tickets/', timeout=10)
    assert response.status_code == 401


def test_token_qa_puede_listar_tickets_sin_modificarlos(qa_api):
    token=os.getenv('ASIS_QA_TOKEN')
    if not token:
        pytest.skip('Sin ASIS_QA_TOKEN de cuenta de prueba; se omite lectura autenticada')
    response=httpx.get(f'{qa_api}/tickets/', headers={'Authorization': f'Bearer {token}'}, timeout=20)
    assert response.status_code == 200, response.text[:200]
    assert isinstance(response.json(), list)
