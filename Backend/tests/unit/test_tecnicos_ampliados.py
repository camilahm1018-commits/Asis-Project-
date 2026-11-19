"""Validaciones de técnico con filas temporales SQLite (no PostgreSQL real)."""
import pytest
from fastapi import HTTPException
from sqlmodel import Session
from Modelos.Usuarios import Usuario
from servicios.validaciones_roles import validar_tecnico_activo

@pytest.mark.parametrize('id_usuario,esperado', [
    (30, None),       # técnico activo
    (10, 400),        # instructor activo
    (9999, 404),      # inexistente
])
def test_validacion_de_rol_y_existencia(engine_qa, id_usuario, esperado):
    with Session(engine_qa) as session:
        if esperado is None:
            assert validar_tecnico_activo(session, id_usuario) is None
        else:
            with pytest.raises(HTTPException) as exc:
                validar_tecnico_activo(session, id_usuario)
            assert exc.value.status_code == esperado

def test_tecnico_inactivo_no_es_asignable(engine_qa):
    with Session(engine_qa) as session:
        usuario = session.get(Usuario, 30)
        usuario.activo = False
        session.add(usuario)
        session.commit()
    with Session(engine_qa) as session:
        with pytest.raises(HTTPException) as exc:
            validar_tecnico_activo(session, 30)
        assert exc.value.status_code == 403
