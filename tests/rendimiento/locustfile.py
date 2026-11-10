from locust import HttpUser, task, between

class AsisLoadTestUser(HttpUser):
    wait_time = between(1, 3)

    def on_start(self):
        response = self.client.post("/api/auth/login", json={
            "username": "admin_test",
            "password": "password123"
        })
        if response.status_code == 200:
            token = response.json().get("access_token")
            self.headers = {"Authorization": f"Bearer {token}"}
        else:
            self.headers = {}

    @task(3)
    def consultar_tickets(self):
        self.client.get("/api/tickets/", headers=self.headers)

    @task(1)
    def consultar_reportes(self):
        self.client.get("/api/reportes/resumen", headers=self.headers)