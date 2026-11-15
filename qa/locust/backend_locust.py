"""Carga HTTP de solo lectura sobre FastAPI; ejecutar desde la raíz de ASIS."""
from locust import HttpUser, between, task
from comun import API, cabeceras_qa


class BackendASISUser(HttpUser):
    host = API
    wait_time = between(0.5, 2)
    weight = 2

    @task(5)
    def salud(self):
        with self.client.get('/', name='API GET /', catch_response=True, timeout=10) as r:
            if r.status_code != 200:
                r.failure(f'Salud HTTP {r.status_code}')

    @task(3)
    def swagger_json(self):
        with self.client.get('/openapi.json', name='API GET /openapi.json', catch_response=True, timeout=15) as r:
            if r.status_code != 200:
                r.failure(f'OpenAPI HTTP {r.status_code}')

    @task(3)
    def tickets_autenticados(self):
        headers = cabeceras_qa()
        if not headers:
            return  # Nunca usar usuario real; token QA es opcional.
        with self.client.get('/tickets/', headers=headers, name='API GET /tickets/',
                             catch_response=True, timeout=20) as r:
            if r.status_code != 200:
                r.failure(f'Tickets HTTP {r.status_code}')
