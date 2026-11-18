"""Validación estática; no se ejecuta SQL sobre la base real."""
from pathlib import Path
import pytest


@pytest.mark.regression
def test_scripts_sql_de_permisos_estan_presentes():
    raiz = Path(__file__).resolve().parents[3]
    ruta = raiz / "base_de_datos" / "asis_permisos_roles.sql"
    assert ruta.exists(), "Falta base_de_datos/asis_permisos_roles.sql"
    contenido = ruta.read_text(encoding="utf-8").lower()
    assert "grant" in contenido
    assert "tecnico" in contenido
    assert "instructor" in contenido
    assert "cuentadante" in contenido
