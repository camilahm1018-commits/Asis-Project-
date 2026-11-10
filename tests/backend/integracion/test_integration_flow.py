from fastapi.testclient import TestClient

def test_obtener_datos_iniciales_db(client: TestClient):
    response = client.get("/api/tickets/")
    assert response.status_code == 200
    data = response.json()
    # Valida que la respuesta sea una lista (viva o con los datos de tu SQL)
    assert isinstance(data, list)