"""Pruebas HTTP para errores, controles de acceso y persistencia local."""
import pytest
from sqlmodel import Session, select
from Modelos.tickets import tickets
from enrutadores import ticket as modulo_ticket

@pytest.mark.integration
@pytest.mark.parametrize('rol,identificador', [
    ('administrador', 50),
    ('instructor', 10),
    ('tecnico', 30),
    ('cuentadante', 40),
])
def test_ticket_inexistente_devuelve_404(cliente_qa, rol, identificador):
    cliente, cambiar_rol = cliente_qa
    cambiar_rol(identificador, rol)
    assert cliente.get('/tickets/987654').status_code == 404

@pytest.mark.integration
def test_cuentadante_no_ve_ambiente_ajeno_por_id(cliente_qa):
    cliente, cambiar_rol = cliente_qa
    cambiar_rol(40, 'cuentadante')
    assert cliente.get('/tickets/2').status_code == 404
    assert cliente.get('/tickets/1').status_code == 200

@pytest.mark.integration
def test_tecnico_no_ve_ticket_resuelto_sin_asignar(cliente_qa):
    cliente, cambiar_rol = cliente_qa
    cambiar_rol(30, 'tecnico')
    assert cliente.get('/tickets/3').status_code == 404

@pytest.mark.integration
def test_imagen_extension_invalida_no_inserta_registro(cliente_qa, engine_qa):
    cliente, cambiar_rol = cliente_qa
    cambiar_rol(50, 'administrador')
    with Session(engine_qa) as session:
        antes = len(session.exec(select(tickets)).all())
    respuesta = cliente.post('/tickets/', data={
        'motivo': 'Debe fallar', 'id_equipo': '1',
        'tipo_salida': 'dano', 'id_estado': '1'
    }, files={'imagen': ('archivo.exe', b'MZ', 'application/octet-stream')})
    assert respuesta.status_code == 400, respuesta.text
    with Session(engine_qa) as session:
        assert len(session.exec(select(tickets)).all()) == antes

@pytest.mark.integration
def test_instructor_no_puede_indicar_creador_ajeno(cliente_qa, monkeypatch):
    """Los datos del token, y no campos extras del formulario, determinan el creador."""
    monkeypatch.setattr(modulo_ticket, '_enviar_notificacion_creacion', lambda *_: None)
    cliente, cambiar_rol = cliente_qa
    cambiar_rol(10, 'instructor')
    respuesta = cliente.post('/tickets/', data={
        'motivo': 'QA propio', 'id_equipo': '1', 'tipo_salida': 'dano',
        'creado_por': '50', 'id_estado': '2', 'atendido': 'true',
    })
    assert respuesta.status_code == 200, respuesta.text
    registro = respuesta.json()
    assert registro['creado_por'] == 10
    assert registro['id_estado'] == 1
    assert registro['atendido'] is False

@pytest.mark.integration
def test_cuentadante_no_puede_reportar_equipo_ajeno(cliente_qa, engine_qa):
    cliente, cambiar_rol = cliente_qa
    cambiar_rol(40, 'cuentadante')
    with Session(engine_qa) as session:
        antes = len(session.exec(select(tickets)).all())
    respuesta = cliente.post('/tickets/', data={
        'motivo': 'No autorizado', 'id_equipo': '2', 'tipo_salida': 'dano',
    })
    assert respuesta.status_code == 403
    with Session(engine_qa) as session:
        assert len(session.exec(select(tickets)).all()) == antes
