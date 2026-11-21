"""Mi Perfil: editar datos de contacto y pedir el cambio de contraseña por correo.

Usa la BD SQLite temporal de conftest.py y NUNCA envía correos reales.
"""
import pytest
from sqlmodel import Session


@pytest.fixture
def cliente_perfil(cliente_qa, engine_qa, monkeypatch):
    """TestClient con /auth sobre SQLite temporal, logueado como el usuario 10."""
    from enrutadores import auth as modulo_auth

    cliente, cambiar_rol = cliente_qa
    monkeypatch.setattr(modulo_auth, 'Session', lambda _motor: Session(engine_qa))
    cambiar_rol(10, 'instructor')
    return cliente, modulo_auth


@pytest.mark.integration
def test_editar_perfil_actualiza_y_devuelve_el_perfil(cliente_perfil):
    cliente, _ = cliente_perfil
    respuesta = cliente.put('/auth/yo', json={
        'nombre': '  Ana María ', 'apellidos': 'Gómez Ruiz', 'telefono': '300 123-4567',
    })
    assert respuesta.status_code == 200, respuesta.text
    datos = respuesta.json()
    assert datos['nombre'] == 'Ana María'          # se quitan los espacios sobrantes
    assert datos['apellidos'] == 'Gómez Ruiz'
    assert datos['telefono'] == '3001234567'       # se guarda sin espacios ni guiones
    # y el GET /auth/yo ya lo refleja
    assert cliente.get('/auth/yo').json()['nombre'] == 'Ana María'


@pytest.mark.integration
def test_editar_perfil_no_permite_cambiar_correo_documento_ni_rol(cliente_perfil):
    cliente, _ = cliente_perfil
    antes = cliente.get('/auth/yo').json()
    respuesta = cliente.put('/auth/yo', json={
        'nombre': 'Nuevo', 'correo': 'otro@sena.edu.co',
        'numero_documento': '999', 'rol': 'administrador', 'id_rol': 3,
    })
    assert respuesta.status_code == 200, respuesta.text
    despues = respuesta.json()
    assert despues['nombre'] == 'Nuevo'
    for campo in ('correo', 'numero_documento', 'rol'):
        assert despues[campo] == antes[campo]


@pytest.mark.integration
def test_editar_perfil_es_parcial_y_permite_borrar_el_telefono(cliente_perfil):
    cliente, _ = cliente_perfil
    antes = cliente.get('/auth/yo').json()
    solo_telefono_vacio = cliente.put('/auth/yo', json={'telefono': ''})
    assert solo_telefono_vacio.status_code == 200
    assert solo_telefono_vacio.json()['telefono'] is None
    assert solo_telefono_vacio.json()['nombre'] == antes['nombre']   # lo demás no se toca


@pytest.mark.integration
@pytest.mark.parametrize('cuerpo, texto', [
    ({'nombre': '   '}, 'nombre es obligatorio'),
    ({'apellidos': ''}, 'apellidos son obligatorios'),
    ({'nombre': 'x' * 51}, 'más de 50'),
    ({'apellidos': 'x' * 101}, 'más de 100'),
    ({'telefono': 'abc123'}, 'teléfono'),
    ({'telefono': '123'}, 'teléfono'),
])
def test_editar_perfil_rechaza_datos_invalidos(cliente_perfil, cuerpo, texto):
    cliente, _ = cliente_perfil
    respuesta = cliente.put('/auth/yo', json=cuerpo)
    assert respuesta.status_code == 400
    assert texto in respuesta.json()['detail']


@pytest.mark.integration
def test_cambio_de_contrasena_envia_enlace_al_correo_del_usuario(cliente_perfil, monkeypatch):
    from seguridad import verificar_token_proposito

    cliente, modulo_auth = cliente_perfil
    enviados = []
    monkeypatch.setattr(
        modulo_auth, 'correo_cambio_contrasena',
        lambda destinatario, nombre, token: enviados.append((destinatario, nombre, token)),
    )

    respuesta = cliente.post('/auth/solicitar-cambio-contrasena')
    assert respuesta.status_code == 200, respuesta.text
    assert len(enviados) == 1
    destinatario, _, token = enviados[0]
    assert destinatario == 'qa10@example.test'                     # siempre al correo de SU cuenta
    assert verificar_token_proposito(token, 'recuperacion') == 10  # sirve en /restablecer-contrasena
    mensaje = respuesta.json()['mensaje']
    assert 'qa10@example.test' not in mensaje                      # el correo sale enmascarado
    assert 'qa' in mensaje and '@example.test' in mensaje and '30 minutos' in mensaje


@pytest.mark.integration
def test_cambio_de_contrasena_informa_si_falla_el_correo(cliente_perfil, monkeypatch):
    cliente, modulo_auth = cliente_perfil

    def falla(*_args):
        raise RuntimeError('SMTP caído')

    monkeypatch.setattr(modulo_auth, 'correo_cambio_contrasena', falla)
    respuesta = cliente.post('/auth/solicitar-cambio-contrasena')
    assert respuesta.status_code == 500
    assert 'No se pudo enviar el correo' in respuesta.json()['detail']
