from fastapi.testclient import TestClient

def test_crear_ticket_sin_autorizacion(client: TestClient):
    response = client.post("/api/tickets/", json={
        "titulo": "Prueba unitaria ticket",
        "descripcion": "Descripción de prueba"
    })
    # Valida que bloquee accesos no autenticados
    assert response.status_code in [401, 403]