"""Validación de IDs en rutas de tickets usando la API real y SQLite temporal."""
from urllib.parse import quote
import pytest

ENTRADAS_NO_ENTERAS = [
    '1 OR 1=1',
    "1' OR '1'='1",
    '1 UNION SELECT 1',
    '1; SELECT 1',
    '0/**/OR/**/1=1',
    '-1;--',
]

@pytest.mark.parametrize('valor', ENTRADAS_NO_ENTERAS)
def test_tickets_rechaza_id_inyectado(cliente_qa, valor):
    cliente, _ = cliente_qa
    ruta = '/tickets/' + quote(valor, safe='')
    respuesta = cliente.get(ruta)
    # Las barras decodificadas crean segmentos adicionales y la ruta no coincide.
    esperado = 404 if "/" in valor else 422
    assert respuesta.status_code == esperado, (
        f'ID no entero aceptado o falla interna: {ruta}: {respuesta.status_code}'
    )
    assert 'Traceback' not in respuesta.text


def test_ticket_ajeno_no_es_visible_para_instructor(cliente_qa):
    cliente, cambiar_rol = cliente_qa
    cambiar_rol(10, 'instructor')
    # El fixture del kit QA crea ticket 2 para otro usuario.
    respuesta = cliente.get('/tickets/2')
    assert respuesta.status_code in (403, 404)


def test_ticket_propio_es_visible_para_instructor(cliente_qa):
    cliente, cambiar_rol = cliente_qa
    cambiar_rol(10, 'instructor')
    respuesta = cliente.get('/tickets/1')
    assert respuesta.status_code == 200
