"""Propósitos, caducidad y alteración de JWT (aislado; sin DB)."""
from datetime import datetime, timedelta, timezone
import pytest
from fastapi import HTTPException
from jose import jwt
from seguridad import ALGORITMO, CLAVE_SECRETA, crear_token_proposito, verificar_token_proposito

@pytest.mark.parametrize('proposito', ['activacion', 'recuperacion'])
def test_token_de_proposito_valido(proposito):
    token = crear_token_proposito(20, proposito, minutos=10)
    assert verificar_token_proposito(token, proposito) == 20

@pytest.mark.parametrize('proposito_esperado', ['activacion', 'recuperacion'])
def test_token_de_uso_distinto_rechazado(proposito_esperado):
    token = crear_token_proposito(20, 'otro', minutos=10)
    with pytest.raises(HTTPException) as exc:
        verificar_token_proposito(token, proposito_esperado)
    assert exc.value.status_code == 400

def test_token_de_proposito_caducado_rechazado():
    payload = {
        'id_usuario': 20,
        'proposito': 'recuperacion',
        'exp': datetime.now(timezone.utc) - timedelta(minutes=2),
    }
    token = jwt.encode(payload, CLAVE_SECRETA, algorithm=ALGORITMO)
    with pytest.raises(HTTPException) as exc:
        verificar_token_proposito(token, 'recuperacion')
    assert exc.value.status_code == 400

def test_token_con_firma_modificada_rechazado():
    token = crear_token_proposito(20, 'activacion', minutos=10)
    cabecera, payload, firma = token.split('.')
    firma_modificada = ('A' if firma[0] != 'A' else 'B') + firma[1:]
    with pytest.raises(HTTPException) as exc:
        verificar_token_proposito('.'.join([cabecera, payload, firma_modificada]), 'activacion')
    assert exc.value.status_code == 400
