import pytest
from fastapi import HTTPException
from jose import jwt

from seguridad import (
    ALGORITMO, CLAVE_SECRETA, crear_token, crear_token_proposito,
    encriptar_contrasena, solo_admin, solo_gestion_tickets,
    verificar_contrasena, verificar_token_proposito,
)


def test_bcrypt_cifra_y_verifica_contrasena():
    hash_ = encriptar_contrasena("ClaveDePrueba#2026")
    assert hash_ != "ClaveDePrueba#2026"
    assert verificar_contrasena("ClaveDePrueba#2026", hash_)
    assert not verificar_contrasena("Incorrecta#2026", hash_)


def test_token_de_acceso_tiene_tipo_y_vencimiento():
    token = crear_token({"id_usuario": 50, "rol": "administrador"})
    datos = jwt.decode(token, CLAVE_SECRETA, algorithms=[ALGORITMO])
    assert datos["tipo"] == "acceso"
    assert datos["id_usuario"] == 50
    assert "exp" in datos


def test_token_recuperacion_no_acepta_activacion():
    token = crear_token_proposito(10, "recuperacion", minutos=5)
    assert verificar_token_proposito(token, "recuperacion") == 10
    with pytest.raises(HTTPException) as error:
        verificar_token_proposito(token, "activacion")
    assert error.value.status_code == 400


@pytest.mark.parametrize("rol", ["tecnico", "instructor", "cuentadante", "administrador_mesa_ayuda"])
def test_solo_admin_bloquea_otros_perfiles(rol):
    with pytest.raises(HTTPException) as error:
        solo_admin({"id_usuario": 10, "rol": rol})
    assert error.value.status_code == 403


def test_mesa_puede_gestionar_pero_no_es_administrador():
    usuario = {"id_usuario": 5, "rol": "administrador_mesa_ayuda"}
    assert solo_gestion_tickets(usuario) == usuario
    with pytest.raises(HTTPException):
        solo_admin(usuario)
