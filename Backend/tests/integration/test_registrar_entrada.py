import pytest
from sqlmodel import Session, select

from enrutadores import ticket
from Modelos.estados_ticket import estados_ticket
from Modelos.His_tickets import His_ticket
from Modelos.tickets import tickets


@pytest.fixture
def entradas(engine_qa, cliente_qa, monkeypatch):
    monkeypatch.setattr(ticket, "_enviar_notificacion_cambio_estado", lambda *_: None)
    with Session(engine_qa) as sesion:
        sesion.add_all([
            estados_ticket(id_estado=7, nombre_e="Trasladado", color="#000000"),
            estados_ticket(id_estado=8, nombre_e="Entregado en ambiente", color="#000000"),
        ])
        sesion.add_all([
            tickets(id_ticket=6, motivo="Préstamo", id_equipo=1, creado_por=10,
                    id_estado=7, atendido=False, tipo_salida="préstamo"),
            tickets(id_ticket=7, motivo="Traslado definitivo", id_equipo=1, creado_por=10,
                    id_estado=7, atendido=False, tipo_salida="traslado"),
        ])
        sesion.get(tickets, 4).tipo_salida = "daño"
        sesion.commit()
    return cliente_qa


@pytest.mark.parametrize("rol,usuario,id_ticket", [
    ("tecnico", 30, 4),
    ("administrador_mesa_ayuda", 5, 4),
    ("instructor", 10, 6),
    ("cuentadante", 40, 6),
])
def test_devuelve_y_registra_historial_una_vez(entradas, engine_qa, rol, usuario, id_ticket):
    cliente, cambiar_rol = entradas
    cambiar_rol(usuario, rol)
    respuesta = cliente.get("/tickets/")
    assert respuesta.status_code == 200, respuesta.text
    assert next(t for t in respuesta.json() if t["id_ticket"] == id_ticket)["puede_registrar_entrada"]

    ruta = f"/tickets/{id_ticket}/registrar-entrada"
    respuesta = cliente.put(ruta)
    assert respuesta.status_code == 200, respuesta.text
    assert respuesta.json()["id_estado"] == 8
    assert respuesta.json()["fecha_retorno"]
    assert respuesta.json()["atendido"]
    assert cliente.put(ruta).status_code == 409
    filas = cliente.get("/tickets/").json()
    assert any(t["id_ticket"] == id_ticket and not t["puede_registrar_entrada"] for t in filas)
    with Session(engine_qa) as sesion:
        historial = sesion.exec(select(His_ticket).where(His_ticket.id_ticket == id_ticket)).all()
        assert len(historial) == 1
        assert historial[0].id_usuario == usuario


@pytest.mark.parametrize("rol,usuario,id_ticket,esperado", [
    ("tecnico", 30, 2, 409),
    ("tecnico", 31, 4, 404),
    ("administrador_mesa_ayuda", 5, 6, 403),
    ("instructor", 20, 6, 404),
    ("cuentadante", 41, 6, 404),
    ("instructor", 10, 7, 409),
])
def test_rechaza_estado_o_responsable_incorrecto(entradas, rol, usuario, id_ticket, esperado):
    cliente, cambiar_rol = entradas
    cambiar_rol(usuario, rol)
    assert cliente.put(f"/tickets/{id_ticket}/registrar-entrada").status_code == esperado


def test_entregado_solo_se_aplica_con_registrar_entrada(entradas):
    cliente, cambiar_rol = entradas
    cambiar_rol(30, "tecnico")
    assert cliente.put("/tickets/4", json={"id_estado": 8}).status_code == 409
    assert cliente.put("/tickets/4", json={"fecha_retorno": "2026-11-20T12:00:00"}).status_code == 403
    assert cliente.put("/tickets/4/registrar-entrada").status_code == 200
    assert cliente.put("/tickets/4", json={"id_estado": 2}).status_code == 409
