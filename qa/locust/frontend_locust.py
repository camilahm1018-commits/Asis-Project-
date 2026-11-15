"""Carga HTTP del FrontEnd Vite; NO simula renderizado React en el navegador."""
from locust import HttpUser, between, task
from comun import UI


class FrontendASISUser(HttpUser):
    host = UI
    wait_time = between(0.5, 2)
    weight = 2

    @task(5)
    def pagina_principal(self):
        with self.client.get('/', name='UI GET /', catch_response=True, timeout=12) as r:
            if r.status_code != 200 or '<html' not in r.text.lower():
                r.failure(f'HTML inválido: {r.status_code}')

    @task(3)
    def pantalla_login(self):
        # Vite en desarrollo responde con el HTML de SPA en esta ruta.
        with self.client.get('/login', name='UI GET /login', catch_response=True, timeout=12) as r:
            if r.status_code != 200:
                r.failure(f'Login HTTP {r.status_code}')

    @task(2)
    def recurso_js(self):
        with self.client.get('/src/main.jsx', name='UI GET /src/main.jsx', catch_response=True, timeout=12) as r:
            if r.status_code != 200:
                r.failure(f'JS HTTP {r.status_code}')
