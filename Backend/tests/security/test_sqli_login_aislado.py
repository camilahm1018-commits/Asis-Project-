"""Pruebas SQLi del inicio de sesión REAL de ASIS, con BD SQLite temporal.
Requiere Backend/tests/conftest.py del kit QA ampliado. No toca PostgreSQL.
"""
import pytest
from enrutadores import auth as auth_router

# Cadenas de entrada de prueba. Ninguna es una instrucción SQL enviada directamente
# al servidor: todas viajan como valores del campo username del formulario.
PAYLOADS_SQLI = [
    "' OR '1'='1' --",
    "admin@sena.edu.co' --",
    "' OR 1=1 --",
    '" OR "1"="1" --',
    "' UNION SELECT NULL --",
    "'/*comentario*/ OR '1'='1",
    "') OR ('a'='a",
    "usuario\\' OR 1=1 --",
    "; SELECT 1 --",
]

@pytest.mark.parametrize('entrada', PAYLOADS_SQLI, ids=lambda x: x[:30])
def test_sqli_no_autentica_usuarios_inexistentes(cliente_qa, engine_qa, monkeypatch, entrada):
    cliente, _ = cliente_qa
    # Solo el endpoint /auth/login utiliza esta conexión; reemplazamos
    # PostgreSQL por la base de prueba en memoria creada en conftest.py.
    monkeypatch.setattr(auth_router, 'motor_auth', engine_qa)
    respuesta = cliente.post(
        '/auth/login',
        data={'username': entrada, 'password': 'qa-contrasena-incorrecta'},
        headers={'Content-Type': 'application/x-www-form-urlencoded'},
    )
    assert respuesta.status_code == 401, (
        f'Posible fallo en autenticación / SQLi: HTTP {respuesta.status_code}; '
        f'respuesta={respuesta.text[:250]!r}'
    )
    assert 'access_token' not in respuesta.text
    assert 'Traceback' not in respuesta.text
    assert 'psycopg2' not in respuesta.text


def test_sqli_consulta_sqlmodel_usa_parametros():
    """Comprobación complementaria: SQLModel no interpola el payload como SQL."""
    from sqlmodel import select
    from Modelos.Usuarios import Usuario
    valor = "' OR '1'='1' --"
    expresion = select(Usuario).where(Usuario.correo_u == valor)
    compilado = expresion.compile()
    assert valor not in str(compilado)
    assert valor in compilado.params.values()
