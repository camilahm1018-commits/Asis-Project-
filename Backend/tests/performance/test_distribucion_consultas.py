"""Microbenchmark aislado: registra p50/p95; no representa concurrencia real."""
import os
import statistics
import time
import pytest
from sqlmodel import Session
from servicios.acceso_tickets import consulta_tickets_permitidos

@pytest.mark.performance
def test_percentiles_consulta_temporal(engine_qa, record_property):
    tiempos_ms=[]
    with Session(engine_qa) as sesion:
        consulta=consulta_tickets_permitidos({'id_usuario': 30, 'rol': 'tecnico'})
        for _ in range(60):
            comienzo=time.perf_counter()
            resultados=sesion.exec(consulta).all()
            tiempos_ms.append((time.perf_counter()-comienzo)*1000)
            assert len(resultados)==3
    ordenados=sorted(tiempos_ms)
    p50=statistics.median(ordenados)
    p95=ordenados[int((len(ordenados)-1)*0.95)]
    record_property('latencia_p50_ms', round(p50,3))
    record_property('latencia_p95_ms', round(p95,3))
    limite=os.getenv('ASIS_QA_MICRO_P95_MS')
    if limite:
        assert p95<float(limite), f'p95 {p95:.2f} ms supera {limite} ms'
