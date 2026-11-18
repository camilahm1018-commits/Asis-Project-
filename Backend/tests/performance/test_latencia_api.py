"""Micro-benchmark aislado: latencia de FastAPI+SQLite temporal, SIN PostgreSQL real.

Los umbrales son guías para detectar regresiones enormes en un mismo equipo;
no sustituyen los escenarios k6 frente a la app levantada en Docker.
"""
import statistics
import time
import pytest


@pytest.mark.performance
def test_latencia_secuencial_lectura_tickets(cliente_qa):
    cliente, cambiar_rol = cliente_qa
    cambiar_rol(10, "instructor")
    tiempos = []
    for _ in range(30):
        inicio = time.perf_counter()
        respuesta = cliente.get('/tickets/')
        tiempos.append((time.perf_counter() - inicio) * 1000)
        assert respuesta.status_code == 200
    percentil_95 = sorted(tiempos)[int(len(tiempos) * .95) - 1]
    print(f'API TestClient/SQLite: mediana={statistics.median(tiempos):.1f} ms; '
          f'p95={percentil_95:.1f} ms')
    assert percentil_95 < 2000, 'Latencia anormalmente alta en prueba local'
