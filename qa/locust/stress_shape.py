"""Forma de estrés suave y controlado. Combinar con mixto_locust.py.

Para activar se requiere ASIS_QA_STRESS_CONFIRM=SI. Se detiene a los 5 minutos.
"""
import os
from locust import LoadTestShape

if os.getenv('ASIS_QA_STRESS_CONFIRM') != 'SI':
    raise RuntimeError('Prueba de estrés deshabilitada. Confirma ASIS_QA_STRESS_CONFIRM=SI en QA local.')


class ASISStressShape(LoadTestShape):
    stages = [
        {'duration': 60, 'users': 2, 'spawn_rate': 1},
        {'duration': 120, 'users': 5, 'spawn_rate': 1},
        {'duration': 180, 'users': 10, 'spawn_rate': 2},
        {'duration': 240, 'users': 20, 'spawn_rate': 2},
        {'duration': 270, 'users': 0, 'spawn_rate': 5},
    ]

    def tick(self):
        t = self.get_run_time()
        for stage in self.stages:
            if t < stage['duration']:
                return (stage['users'], stage['spawn_rate'])
        return None
