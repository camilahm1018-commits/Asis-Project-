#!/usr/bin/env python3
"""Informe informativo sobre cabeceras de API y FrontEnd locales.
No ejecuta ataques ni modifica registros. Requiere solo Python estándar.
"""
import argparse
from urllib.parse import urlsplit
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError


def comprobar(url):
    v = urlsplit(url)
    if v.scheme not in ('http', 'https') or v.hostname not in ('localhost', '127.0.0.1', '::1'):
        raise SystemExit('Solo se permite ejecutar este script en localhost')
    try:
        with urlopen(Request(url, headers={'User-Agent': 'ASIS-Security-Audit/1.0'}), timeout=10) as r:
            cab = r.headers
            print(f'URL: {url} | HTTP {r.status}')
            for key in ['Content-Security-Policy', 'X-Content-Type-Options', 'Referrer-Policy',
                        'X-Frame-Options', 'Strict-Transport-Security']:
                valor = cab.get(key)
                if valor:
                    print(f'  OK       {key}: configurado')
                else:
                    print(f'  REVISAR  {key}: ausente')
            if v.scheme == 'http':
                print('  NOTA: HSTS no aplica a HTTP local; se revisa en despliegues HTTPS.')
    except (HTTPError, URLError) as e:
        print(f'No se pudo comprobar {url}: {e}')

if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--api', default='http://127.0.0.1:8000/docs')
    ap.add_argument('--frontend', default='http://127.0.0.1:5173/login')
    a = ap.parse_args()
    comprobar(a.api)
    comprobar(a.frontend)
