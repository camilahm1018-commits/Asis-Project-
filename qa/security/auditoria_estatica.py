#!/usr/bin/env python3
"""Inventario de posibles riesgos. Solo lee código, no necesita dependencias externas.
Devuelve JSON sin incluir contraseñas, tokens ni fragmentos sensibles de código.
ADVERTENCIA: son heurísticas para revisión manual, no un escáner completo.
"""
from pathlib import Path
import argparse
import json
import re
import subprocess
from datetime import datetime, timezone

PATTERNS = [
    ('sql_dinamico_fstring', re.compile(r'\b(?:text|execute|exec_driver_sql)\s*\(\s*f[\'"]', re.I), 'alta'),
    ('sql_dinamico_format', re.compile(r'\b(?:text|execute|exec_driver_sql)\s*\([^\n]*\.format\s*\(', re.I), 'alta'),
    ('sql_dinamico_por_concatenacion', re.compile(r'\b(?:text|execute|exec_driver_sql)\s*\([^\n]*\+', re.I), 'alta'),
    ('html_sin_sanitizar', re.compile(r'\bdangerouslySetInnerHTML\b'), 'media'),
    ('uso_eval', re.compile(r'(?<![\w.])eval\s*\('), 'alta'),
    ('token_en_localstorage', re.compile(r'\blocalStorage\.(?:getItem|setItem)\s*\(\s*[\'"]access_token[\'"]'), 'informativa'),
    ('clave_jwt_hardcodeada', re.compile(r'^\s*(?:CLAVE_SECRETA|SECRET_KEY|JWT_SECRET)\s*=\s*[\'"][^\'"]+[\'"]', re.M), 'alta'),
]

def auditar(raiz: Path):
    hallazgos = []
    for subruta in (Path('Backend'), Path('FrontEnd/src')):
        carpeta = raiz / subruta
        if not carpeta.exists():
            continue
        for archivo in carpeta.rglob('*'):
            if not archivo.is_file() or archivo.suffix not in ('.py', '.jsx', '.js', '.ts', '.tsx'):
                continue
            if any(parte in {'node_modules', 'tests', '__tests__', 'dist', 'build', 'venv', '.venv', '__pycache__'} for parte in archivo.parts):
                continue
            texto = archivo.read_text(encoding='utf-8', errors='replace')
            for num, linea in enumerate(texto.splitlines(), start=1):
                for nombre, patron, riesgo in PATTERNS:
                    if patron.search(linea):
                        hallazgos.append({'archivo': str(archivo.relative_to(raiz)), 'linea': num,
                                          'tipo': nombre, 'nivel': riesgo})
    rastreados = []
    try:
        r = subprocess.run(['git', '-C', str(raiz), 'ls-files', '--', '.env', 'Backend/.env', 'FrontEnd/.env'],
                           capture_output=True, text=True, timeout=10, check=True)
        rastreados = [n for n in r.stdout.splitlines() if n]
    except (OSError, subprocess.SubprocessError):
        pass
    if rastreados:
        hallazgos.append({'archivo': ', '.join(rastreados), 'linea': 0,
                          'tipo': 'archivos_env_rastreados_por_git', 'nivel': 'alta'})
    return {'fecha_utc': datetime.now(timezone.utc).isoformat(),
            'nota': 'Heurísticas de revisión; un resultado vacío NO acredita seguridad.',
            'hallazgos': hallazgos, 'total': len(hallazgos)}

if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--proyecto', default='.', help='Carpeta raíz de ASIS')
    ap.add_argument('--salida', default='', help='Archivo JSON opcional')
    args = ap.parse_args()
    data = auditar(Path(args.proyecto).resolve())
    cuerpo = json.dumps(data, ensure_ascii=False, indent=2)
    if args.salida:
        salida = Path(args.salida)
        salida.parent.mkdir(parents=True, exist_ok=True)
        salida.write_text(cuerpo + '\n', encoding='utf-8')
        print(f'Auditoría generada: {salida} ({data["total"]} posibles hallazgos)')
    else:
        print(cuerpo)
