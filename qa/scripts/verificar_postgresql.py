#!/usr/bin/env python3
"""Audita roles y permisos SQL; NO ejecuta INSERT/UPDATE/DELETE/DDL."""
from sqlalchemy import text
from conexion_db import motor_auth

consulta = text("""
SELECT
  (SELECT count(*) FROM pg_roles WHERE rolname LIKE 'asis_app_%') AS cuentas_tecnicas,
  has_column_privilege('asis_app_tecnico','public.usuarios','nombre_u','SELECT') AS tecnico_lee_nombre,
  has_column_privilege('asis_app_tecnico','public.usuarios','contrasena_u','SELECT') AS tecnico_lee_hash,
  has_table_privilege('asis_app_tecnico','public.tickets','DELETE') AS tecnico_elimina_ticket
""")
with motor_auth.connect() as conn:
    fila = conn.execute(consulta).mappings().one()
    resultado = dict(fila)
    print(resultado)
    assert resultado['cuentas_tecnicas'] == 6, 'Deben existir seis cuentas técnicas'
    assert resultado['tecnico_lee_nombre'] is True
    assert resultado['tecnico_lee_hash'] is False
    assert resultado['tecnico_elimina_ticket'] is False
print('OK: comprobaciones SQL read-only aprobadas.')
