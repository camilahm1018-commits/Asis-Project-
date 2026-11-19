"""Matriz de autorización ASIS; no abre conexiones a PostgreSQL."""
import pytest
from fastapi import HTTPException
from seguridad import solo_admin, solo_gestion_tickets, solo_tecnico

CASOS = [
    ("administrador", True, True, False),
    ("administrador_mesa_ayuda", False, True, False),
    ("tecnico", False, False, True),
    ("instructor", False, False, False),
    ("cuentadante", False, False, False),
    ("desconocido", False, False, False),
]

@pytest.mark.parametrize('rol,admin,mesa,tecnico', CASOS)
def test_matriz_de_permisos(rol, admin, mesa, tecnico):
    usuario = {'rol': rol, 'id_usuario': 100}
    for dependencia, permitido in [
        (solo_admin, admin),
        (solo_gestion_tickets, mesa),
        (solo_tecnico, tecnico),
    ]:
        if permitido:
            assert dependencia(usuario) == usuario
        else:
            with pytest.raises(HTTPException) as exc:
                dependencia(usuario)
            assert exc.value.status_code == 403
