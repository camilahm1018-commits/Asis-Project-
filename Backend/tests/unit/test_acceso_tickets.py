import pytest
from fastapi import HTTPException
from sqlmodel import Session

from servicios.acceso_tickets import consulta_tickets_permitidos


@pytest.mark.parametrize("rol,id_usuario,esperados", [
    ("administrador", 50, {1, 2, 3, 4}),
    ("administrador_mesa_ayuda", 5, {1, 2, 3, 4}),
    ("instructor", 10, {1}),
    ("tecnico", 30, {1, 2, 4}),
    ("cuentadante", 40, {1, 4}),
    ("cuentadante", 41, {2, 3, 4}),
])
def test_consultas_filtradas_por_perfil(engine_qa, rol, id_usuario, esperados):
    with Session(engine_qa) as sesion:
        consulta = consulta_tickets_permitidos({"rol": rol, "id_usuario": id_usuario})
        encontrados = {t.id_ticket for t in sesion.exec(consulta).all()}
    assert encontrados == esperados


def test_rol_desconocido_no_puede_consultar():
    with pytest.raises(HTTPException) as error:
        consulta_tickets_permitidos({"rol": "invitado", "id_usuario": 999})
    assert error.value.status_code == 403
