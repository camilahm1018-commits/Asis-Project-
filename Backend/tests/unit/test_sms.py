from types import SimpleNamespace
from urllib.parse import parse_qs

import httpx

from servicios import sms


def test_sms_desactivado_no_abre_conexion(monkeypatch):
    monkeypatch.setenv("ASIS_SMS_ENABLED", "false")

    def inesperado(**kwargs):
        raise AssertionError("SMS desactivado abrió una conexión")

    monkeypatch.setattr(sms, "httpx", SimpleNamespace(Client=inesperado))
    sms.enviar_sms(["3001234567"], "Aviso de prueba")


def test_sms_normaliza_y_limita_destinatarios(monkeypatch):
    cuenta = "AC" + "a" * 32
    monkeypatch.setenv("ASIS_SMS_ENABLED", "true")
    monkeypatch.setenv("TWILIO_ACCOUNT_SID", cuenta)
    monkeypatch.setenv("TWILIO_API_KEY", "SK" + "b" * 32)
    monkeypatch.setenv("TWILIO_API_SECRET", "solo-falso-para-prueba")
    monkeypatch.setenv("TWILIO_FROM_NUMBER", "+15005550006")
    monkeypatch.setenv("ASIS_SMS_ALLOWED_NUMBERS", "+573001234567")

    solicitudes = []

    def responder(request):
        solicitudes.append(request)
        return httpx.Response(201, json={"status": "queued"})

    monkeypatch.setattr(sms, "httpx", SimpleNamespace(
        Client=lambda **kwargs: httpx.Client(transport=httpx.MockTransport(responder), **kwargs),
        RequestError=httpx.RequestError,
    ))
    sms.enviar_sms(["300 123-4567", "+573001234567", "+573001234568", None], "Aviso de prueba")

    assert len(solicitudes) == 1
    solicitud = solicitudes[0]
    assert solicitud.method == "POST"
    assert str(solicitud.url) == f"https://api.twilio.com/2010-04-01/Accounts/{cuenta}/Messages.json"
    assert parse_qs(solicitud.content.decode()) == {
        "To": ["+573001234567"], "From": ["+15005550006"], "Body": ["Aviso de prueba"],
    }
