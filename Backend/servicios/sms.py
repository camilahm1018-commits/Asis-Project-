import logging
import os
import re

import httpx

logger = logging.getLogger(__name__)


def numero_sms(telefono: str | None) -> str | None:
    formato = re.sub(r"[\s().-]", "", telefono or "")
    if re.fullmatch(r"3[0-9]{9}", formato):
        formato = f"+57{formato}"
    return formato if re.fullmatch(r"\+[1-9][0-9]{7,14}", formato) else None


def enviar_sms(destinatarios: list[str | None], mensaje: str) -> None:
    if os.getenv("ASIS_SMS_ENABLED", "").strip().lower() not in {"1", "true"}:
        return

    numeros = {numero for telefono in destinatarios if (numero := numero_sms(telefono))}
    lista_prueba = os.getenv("ASIS_SMS_ALLOWED_NUMBERS", "").strip()
    if lista_prueba:
        numeros.intersection_update(numero_sms(telefono) for telefono in lista_prueba.split(","))
    if not numeros:
        return

    cuenta = os.getenv("TWILIO_ACCOUNT_SID", "").strip()
    clave = os.getenv("TWILIO_API_KEY", "").strip()
    secreto = os.getenv("TWILIO_API_SECRET", "").strip()
    remitente = os.getenv("TWILIO_FROM_NUMBER", "").strip()
    if not (re.fullmatch(r"AC[0-9a-fA-F]{32}", cuenta)
            and re.fullmatch(r"SK[0-9a-fA-F]{32}", clave) and secreto
            and re.fullmatch(r"\+[1-9][0-9]{7,14}", remitente)):
        logger.warning("SMS habilitado pero falta configurar Twilio en el backend")
        return

    url = f"https://api.twilio.com/2010-04-01/Accounts/{cuenta}/Messages.json"
    with httpx.Client(auth=(clave, secreto), timeout=5.0) as cliente:
        for numero in sorted(numeros):
            try:
                respuesta = cliente.post(url, data={"To": numero, "From": remitente, "Body": mensaje})
                if not respuesta.is_success:
                    logger.warning("Twilio rechazó un SMS de ASIS (HTTP %s)", respuesta.status_code)
            except httpx.RequestError:
                logger.warning("No se pudo conectar con Twilio para enviar un SMS de ASIS")
