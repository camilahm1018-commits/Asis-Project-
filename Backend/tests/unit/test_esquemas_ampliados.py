"""Regresiones de contratos de datos, sin servicios externos."""
from Modelos.tickets import TicketsEditar
from Modelos.Usuarios import UsuarioLeer


def test_edicion_parcial_no_cambia_otras_columnas():
    schema = TicketsEditar(motivo='Solo el motivo')
    assert schema.model_dump(exclude_unset=True) == {'motivo': 'Solo el motivo'}


def test_edicion_explicita_con_null_se_distingue_de_omision():
    schema = TicketsEditar(fecha_retorno=None)
    assert schema.model_dump(exclude_unset=True) == {'fecha_retorno': None}


def test_modelo_de_lectura_no_expone_campos_secretos():
    assert 'contrasena_u' not in UsuarioLeer.model_fields
