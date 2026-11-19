import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from enrutadores import ticket


@pytest.mark.integration
def test_tickets_requiere_token_cuando_no_hay_override():
    app = FastAPI()
    app.include_router(ticket.asis)
    respuesta = TestClient(app).get("/tickets/")
    assert respuesta.status_code == 401


@pytest.mark.integration
@pytest.mark.parametrize("rol,id_usuario,esperados", [
    ("administrador", 50, {1, 2, 3, 4}),
    ("administrador_mesa_ayuda", 5, {1, 2, 3, 4}),
    ("instructor", 10, {1}),
    ("tecnico", 30, {1, 2, 4}),
    ("cuentadante", 40, {1, 4}),
])
def test_listar_tickets_respeta_permisos(cliente_qa, rol, id_usuario, esperados):
    cliente, cambiar_rol = cliente_qa
    cambiar_rol(id_usuario, rol)
    respuesta = cliente.get("/tickets/")
    assert respuesta.status_code == 200, respuesta.text
    ids = {fila["id_ticket"] for fila in respuesta.json()}
    assert ids == esperados


@pytest.mark.integration
def test_instructor_no_puede_ver_ticket_ajeno_por_id(cliente_qa):
    cliente, cambiar_rol = cliente_qa
    cambiar_rol(10, "instructor")
    assert cliente.get("/tickets/1").status_code == 200
    assert cliente.get("/tickets/2").status_code == 404


@pytest.mark.integration
def test_tecnico_no_puede_crear_ticket(cliente_qa):
    cliente, cambiar_rol = cliente_qa
    cambiar_rol(30, "tecnico")
    respuesta = cliente.post("/tickets/", data={
        "motivo": "Reporte de QA", "id_equipo": "1", "tipo_salida": "dano",
        "id_estado": "1", "atendido": "false",
    })
    assert respuesta.status_code == 403


@pytest.mark.integration
def test_no_se_admite_tipo_salida_invalido(cliente_qa):
    cliente, cambiar_rol = cliente_qa
    cambiar_rol(10, "instructor")
    respuesta = cliente.post("/tickets/", data={
        "motivo": "QA", "id_equipo": "1", "tipo_salida": "desconocido"
    })
    assert respuesta.status_code == 422


@pytest.mark.integration
def test_instructor_no_puede_editar_campos_administrativos(cliente_qa):
    cliente, cambiar_rol = cliente_qa
    cambiar_rol(10, "instructor")
    respuesta = cliente.put("/tickets/1", json={"atendido": True})
    assert respuesta.status_code == 403


@pytest.mark.integration
def test_tecnico_no_puede_modificar_ticket_ajeno(cliente_qa):
    cliente, cambiar_rol = cliente_qa
    cambiar_rol(30, "tecnico")
    respuesta = cliente.put("/tickets/1", json={"id_estado": 2})
    assert respuesta.status_code == 403


@pytest.mark.integration
def test_crear_ticket_no_debe_marcarse_atendido_por_instructor(cliente_qa, monkeypatch):
    """Aísla el envío de correo: confirma datos persistidos en SQLite temporal."""
    from enrutadores import ticket as modulo_ticket
    monkeypatch.setattr(modulo_ticket, "_enviar_notificacion_creacion", lambda _: None)
    cliente, cambiar_rol = cliente_qa
    cambiar_rol(10, "instructor")
    respuesta = cliente.post("/tickets/", data={
        "motivo": "Prueba aislada", "id_equipo": "1", "tipo_salida": "dano",
        "id_estado": "2", "atendido": "true",
    })
    assert respuesta.status_code == 200, respuesta.text
    assert respuesta.json()["creado_por"] == 10
    assert respuesta.json()["id_estado"] == 1
    assert respuesta.json()["atendido"] is False


@pytest.mark.integration
def test_login_real_con_bd_temporal_y_bcrypt(engine_qa, monkeypatch):
    """El endpoint /auth/login usa SQLite temporal; nunca toca motor_auth real."""
    from sqlmodel import Session
    from Modelos.Usuarios import Usuario
    from seguridad import encriptar_contrasena
    from enrutadores import auth as modulo_auth

    with Session(engine_qa) as sesion:
        admin = sesion.get(Usuario, 50)
        admin.contrasena_u = encriptar_contrasena('ClaveQA#2026Segura')
        sesion.add(admin)
        sesion.commit()

    monkeypatch.setattr(modulo_auth, 'Session', lambda _motor: Session(engine_qa))
    app = FastAPI()
    app.include_router(modulo_auth.asis)
    cliente = TestClient(app)
    incorrecta = cliente.post('/auth/login', data={
        'username': 'qa50@example.test', 'password': 'clave-falsa',
    })
    assert incorrecta.status_code == 401
    correcta = cliente.post('/auth/login', data={
        'username': 'qa50@example.test', 'password': 'ClaveQA#2026Segura',
    })
    assert correcta.status_code == 200, correcta.text
    assert correcta.json()['rol'] == 'administrador'
    assert correcta.json()['access_token']
    cliente.close()
