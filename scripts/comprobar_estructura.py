#!/usr/bin/env python3
"""Comprobaciones estáticas sin Docker ni contraseñas."""
from pathlib import Path
import ast
import re
import sys

root = Path(__file__).resolve().parent.parent
errors = []

for p in (root / 'Backend').rglob('*.py'):
    try:
        ast.parse(p.read_text(encoding='utf-8'), filename=str(p))
    except SyntaxError as exc:
        errors.append(f'Sintaxis Python {p}: {exc}')

for p in (root / 'FrontEnd/src').rglob('*'):
    if p.suffix not in ('.jsx', '.js'):
        continue
    src = p.read_text(encoding='utf-8')
    for m in re.finditer(r'''\bfrom\s+['"](\.[^'"]+)['"]''', src):
        target = p.parent / m.group(1)
        options = [target, Path(str(target) + '.js'), Path(str(target) + '.jsx'),
                   target / 'index.js', target / 'index.jsx']
        if not any(o.is_file() for o in options):
            errors.append(f'Import roto: {p.relative_to(root)} -> {m.group(1)}')

for p in (root / 'Backend/enrutadores').glob('*.py'):
    if p.name in ('__init__.py', 'auth.py', 'contactanos.py'):
        continue
    src = p.read_text(encoding='utf-8')
    if 'Sesion_dependencia' in src or 'motor_bd' in src:
        errors.append(f'Sesión general todavía en {p.name}')
    if 'verificar_token' not in src:
        errors.append(f'No se ve autenticación en {p.name}')

sql = (root / 'base_de_datos/insert_datos.sql').read_text()
if 'admin@sena.edu.co' in sql:
    errors.append('Admin inicial todavía tiene hash SQL estático')
for env in ('.env', 'Backend/.env', 'FrontEnd/.env'):
    if (root / env).exists():
        errors.append(f'Archivo privado en ZIP: {env}')
config = (root / 'docker-compose.yml').read_text()
for name in ('01_insert_datos.sql', '02_roles.sql', '03_permisos.sql'):
    if name not in config:
        errors.append(f'No se monta {name} al iniciar PostgreSQL')

if errors:
    print('FALLÓ:')
    for error in errors:
        print(' -', error)
    sys.exit(1)
print('OK: sintaxis Python, imports relativos, seguridad básica y SQL de Docker.')
