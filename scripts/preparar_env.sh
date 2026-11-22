#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
python3 - <<'PYENV'
import secrets, pathlib
p=pathlib.Path('.env')
if not p.exists():
    keys=['ASIS_POSTGRES_PASSWORD','ASIS_DB_AUTH_PASSWORD','ASIS_DB_ADMIN_PASSWORD',
          'ASIS_DB_INSTRUCTOR_PASSWORD','ASIS_DB_TECNICO_PASSWORD',
          'ASIS_DB_MESA_PASSWORD','ASIS_DB_CUENTADANTE_PASSWORD','ASIS_JWT_SECRET',
          'ASIS_INITIAL_ADMIN_PASSWORD']
    lines=[f'{key}={secrets.token_hex(24)}' for key in keys]
    lines.insert(-1, 'ASIS_INITIAL_ADMIN_EMAIL=admin@sena.edu.co')
    p.write_text('\n'.join(lines)+'\n')
    print('Creado .env con claves únicas (NO compartir)')
else:
    existing=p.read_text()
    add=[]
    for k in ('ASIS_JWT_SECRET','ASIS_INITIAL_ADMIN_PASSWORD'):
        if not any(line.split('=', 1)[0].strip() == k for line in existing.splitlines() if '=' in line):
            add.append(k+'='+secrets.token_hex(24))
    if add:
        with p.open('a') as f: f.write('\n'+'\n'.join(add)+'\n')
        print('Se añadieron solo las variables faltantes a .env')
    else:
        print('El .env existente quedó intacto')
p.chmod(0o600)
PYENV
for target in Backend FrontEnd; do
  if [ ! -f "$target/.env" ]; then
    cp "$target/.env.example" "$target/.env"
    chmod 600 "$target/.env"
    echo "Creado $target/.env sin claves de correo"
  fi
done
printf '\nConfiguración preparada. Revisa .env; no lo subas a GitHub.\n'
