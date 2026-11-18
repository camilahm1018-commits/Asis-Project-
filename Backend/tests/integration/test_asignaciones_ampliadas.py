"""Flujo de asignación con DB temporal. SQLite no prueba bloqueos FOR UPDATE."""
import pytest
from fastapi import HTTPException
from sqlmodel import Session, select
from enrutadores.asig_tec import registrar_asignacion
from Modelos.asig_tec import Asig_tec
from Modelos.tickets import tickets
from Modelos.Usuarios import Usuario

@pytest.mark.integration
def test_asignar_actualiza_ticket_y_crea_historial(engine_qa):
    with Session(engine_qa) as session:
        with session.begin():
            asignacion = registrar_asignacion(session, id_ticket=1, id_tecnico=30, id_asignador=50)
            assert asignacion.id_asignacion is not None
    with Session(engine_qa) as session:
        ticket = session.get(tickets, 1)
        assert ticket.asignado_a == 30
        registros = session.exec(select(Asig_tec).where(Asig_tec.id_ticket == 1)).all()
        assert len(registros) == 1
        assert registros[0].id_tecnico == 30
        assert registros[0].asignado_por == 50

@pytest.mark.integration
def test_ticket_ya_asignado_devuelve_conflicto_y_no_duplica(engine_qa):
    with Session(engine_qa) as session:
        antes = len(session.exec(select(Asig_tec)).all())
        with pytest.raises(HTTPException) as exc:
            registrar_asignacion(session, id_ticket=2, id_tecnico=30, id_asignador=50)
        assert exc.value.status_code == 409
        assert len(session.exec(select(Asig_tec)).all()) == antes

@pytest.mark.integration
@pytest.mark.parametrize('id_ticket,id_tecnico,estado', [
    (9999, 30, 404),
    (1, 10, 400),
    (1, 9999, 404),
])
def test_asignaciones_invalidas_sin_commit(engine_qa, id_ticket, id_tecnico, estado):
    with Session(engine_qa) as session:
        with pytest.raises(HTTPException) as exc:
            registrar_asignacion(session, id_ticket, id_tecnico, 50)
        assert exc.value.status_code == estado
        session.rollback()
    with Session(engine_qa) as session:
        assert session.get(tickets, 1).asignado_a is None

@pytest.mark.integration
def test_tecnico_inactivo_no_recibe_asignacion(engine_qa):
    with Session(engine_qa) as session:
        u = session.get(Usuario, 30)
        u.activo = False
        session.add(u)
        session.commit()
    with Session(engine_qa) as session:
        with pytest.raises(HTTPException) as exc:
            registrar_asignacion(session, 1, 30, 50)
        assert exc.value.status_code == 403
        session.rollback()
    with Session(engine_qa) as session:
        assert session.get(tickets, 1).asignado_a is None
