"""Utilidades compartidas para Locust: seguridad y autenticación opcional."""
import os
from urllib.parse import urlparse

API = os.getenv('ASIS_QA_API_URL', 'http://127.0.0.1:8000').rstrip('/')
UI = os.getenv('ASIS_QA_UI_URL', 'http://127.0.0.1:5173').rstrip('/')


def validar_destino(url):
    parsed = urlparse(url)
    if parsed.scheme not in {'http', 'https'} or not parsed.hostname:
        raise ValueError(f'Destino HTTP no válido: {url}')
    if (parsed.hostname not in {'127.0.0.1', 'localhost', '::1'}
            and os.getenv('ASIS_QA_PERMITIR_REMOTO') != 'SI'):
        raise RuntimeError('Locust bloqueó un servidor remoto. Usa ASIS_QA_PERMITIR_REMOTO=SI solo en QA autorizada.')


validar_destino(API)
validar_destino(UI)


def cabeceras_qa():
    token = os.getenv('ASIS_QA_TOKEN', '').strip()
    return {'Authorization': f'Bearer {token}'} if token else {}
