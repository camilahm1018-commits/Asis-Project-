import os
import smtplib
from email.mime.text import MIMEText

# Leo la configuración del correo desde variables de entorno. Si no
# están puestas, no intento conectarme a ningún servidor: solo dejo
# el correo impreso en la consola para poder seguir probando el
# sistema en desarrollo sin tener un SMTP real todavía.
SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASS = os.getenv("SMTP_PASS")
SMTP_FROM = os.getenv("SMTP_FROM", "asis@cgmlti.sena.edu.co")

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")


def enviar_correo(destinatario: str, asunto: str, cuerpo: str) -> None:

    if not SMTP_HOST or not SMTP_USER or not SMTP_PASS:
        print("\n----- CORREO (SMTP no configurado, solo lo muestro aquí) -----")
        print(f"Para: {destinatario}")
        print(f"Asunto: {asunto}")
        print(cuerpo)
        print("----------------------------------------------------------\n")
        return

    mensaje = MIMEText(cuerpo)
    mensaje["Subject"] = asunto
    mensaje["From"] = SMTP_FROM
    mensaje["To"] = destinatario

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as servidor:
        servidor.starttls()
        servidor.login(SMTP_USER, SMTP_PASS)
        servidor.sendmail(SMTP_FROM, [destinatario], mensaje.as_string())


def correo_activacion(destinatario: str, nombre: str, token: str) -> None:

    link = f"{FRONTEND_URL}/activar-cuenta?token={token}"

    cuerpo = (
        f"Hola {nombre},\n\n"
        "Tu cuenta en ASIS - Asistencia Integral SENA ya está pre-registrada. "
        f"Para activarla y crear tu contraseña entra a este link:\n\n{link}\n\n"
        "Este link es de un solo uso y vence en un tiempo corto por seguridad."
    )

    enviar_correo(destinatario, "Activa tu cuenta en ASIS", cuerpo)


def correo_recuperacion(destinatario: str, nombre: str, token: str) -> None:

    link = f"{FRONTEND_URL}/restablecer-contrasena?token={token}"

    cuerpo = (
        f"Hola {nombre},\n\n"
        "Recibimos una solicitud para restablecer tu contraseña en ASIS. "
        f"Si fuiste tú, entra a este link para crear una nueva:\n\n{link}\n\n"
        "Si no fuiste tú, puedes ignorar este correo."
    )

    enviar_correo(destinatario, "Recupera tu contraseña en ASIS", cuerpo)


def correo_alerta_intento_no_valido(destinatario_admin: str, datos_intento: dict) -> None:

    cuerpo = (
        "Se intentó confirmar/activar una cuenta con datos que no coinciden "
        "con ningún registro pre-cargado, o que ya está activo.\n\n"
        f"Datos ingresados: {datos_intento}\n\n"
        "Revisa si corresponde a un usuario legítimo mal pre-registrado o a "
        "un intento indebido."
    )

    enviar_correo(destinatario_admin, "Alerta ASIS: intento de activación no válido", cuerpo)
