import os
import smtplib
from email.mime.text import MIMEText

# Leo la configuración del correo desde variables de entorno.
SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASS = os.getenv("SMTP_PASS")
SMTP_FROM = os.getenv("SMTP_FROM", "asis@cgmlti.sena.edu.co")

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")


def enviar_correo(destinatario: str, asunto: str, cuerpo_html: str) -> None:
    if not SMTP_HOST or not SMTP_USER or not SMTP_PASS:
        print("\n----- CORREO (SMTP no configurado, solo lo muestro aquí) -----")
        print(f"Para: {destinatario}")
        print(f"Asunto: {asunto}")
        print("Contenido HTML generado (revisa el código para ver el diseño)")
        print("----------------------------------------------------------\n")
        return

    # Cambiamos a "html" para que el correo interprete el diseño y los colores
    mensaje = MIMEText(cuerpo_html, "html")
    mensaje["Subject"] = asunto
    mensaje["From"] = SMTP_FROM
    mensaje["To"] = destinatario

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as servidor:
        servidor.starttls()
        servidor.login(SMTP_USER, SMTP_PASS)
        servidor.sendmail(SMTP_FROM, [destinatario], mensaje.as_string())


def correo_activacion(destinatario: str, nombre: str, token: str) -> None:
    link = f"{FRONTEND_URL}/activar-cuenta?token={token}"

    cuerpo_html = f"""
    <html>
      <body style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f0f4f8; margin: 0; padding: 0;">
        <div style="max-width: 600px; margin: 30px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
          
          <!-- Encabezado Azul -->
          <div style="background-color: #1976D2; color: #ffffff; padding: 24px; text-align: center;">
            <h2 style="margin: 0; font-size: 24px; font-weight: 600;">Bienvenido a ASIS</h2>
            <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">Asistencia Integral SENA</p>
          </div>

          <!-- Cuerpo del mensaje -->
          <div style="padding: 32px 24px; color: #333333;">
            <p style="font-size: 16px; margin-bottom: 20px;">Hola <strong>{nombre}</strong>,</p>
            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
              Tu cuenta en el sistema <strong>ASIS</strong> ha sido pre-registrada exitosamente. 
              Para finalizar el proceso y crear tu contraseña de acceso, por favor haz clic en el siguiente botón:
            </p>
            
            <!-- Botón de Acción -->
            <div style="text-align: center; margin: 32px 0;">
              <a href="{link}" style="background-color: #1976D2; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px rgba(25, 118, 210, 0.3);">
                Activar mi cuenta
              </a>
            </div>

            <p style="font-size: 14px; color: #666666; line-height: 1.5; margin-top: 32px; text-align: center;">
              Si el botón no funciona, puedes copiar y pegar el siguiente enlace en tu navegador:<br>
              <a href="{link}" style="color: #1976D2; word-break: break-all; text-decoration: underline;">{link}</a>
            </p>
          </div>

          <!-- Pie de página -->
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
            <p style="margin: 0; font-size: 13px; color: #888888;">Sistema ASIS - SENA</p>
            <p style="margin: 6px 0 0 0; font-size: 12px; color: #aaaaaa;">Este es un correo automático, por favor no respondas a este mensaje.</p>
          </div>
        </div>
      </body>
    </html>
    """
    enviar_correo(destinatario, "Activa tu cuenta en ASIS", cuerpo_html)


def correo_recuperacion(destinatario: str, nombre: str, token: str) -> None:
    link = f"{FRONTEND_URL}/restablecer-contrasena?token={token}"

    cuerpo_html = f"""
    <html>
      <body style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f0f4f8; margin: 0; padding: 0;">
        <div style="max-width: 600px; margin: 30px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
          
          <!-- Encabezado Azul -->
          <div style="background-color: #0D47A1; color: #ffffff; padding: 24px; text-align: center;">
            <h2 style="margin: 0; font-size: 24px; font-weight: 600;">Recuperación de Contraseña</h2>
            <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">Sistema ASIS</p>
          </div>

          <!-- Cuerpo del mensaje -->
          <div style="padding: 32px 24px; color: #333333;">
            <p style="font-size: 16px; margin-bottom: 20px;">Hola <strong>{nombre}</strong>,</p>
            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
              Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en el sistema <strong>ASIS</strong>. 
              Haz clic en el botón de abajo para crear una nueva contraseña de forma segura:
            </p>
            
            <!-- Botón de Acción -->
            <div style="text-align: center; margin: 32px 0;">
              <a href="{link}" style="background-color: #0D47A1; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px rgba(13, 71, 161, 0.3);">
                Restablecer mi contraseña
              </a>
            </div>

            <p style="font-size: 14px; color: #666666; line-height: 1.5; margin-top: 32px; text-align: center;">
              Si el botón no funciona, puedes copiar y pegar el siguiente enlace en tu navegador:<br>
              <a href="{link}" style="color: #0D47A1; word-break: break-all; text-decoration: underline;">{link}</a>
            </p>
          </div>

          <!-- Pie de página -->
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
            <p style="margin: 0; font-size: 13px; color: #888888;">Sistema ASIS - SENA</p>
            <p style="margin: 6px 0 0 0; font-size: 12px; color: #aaaaaa;">Este es un correo automático, por favor no respondas a este mensaje.</p>
          </div>
        </div>
      </body>
    </html>
    """
    enviar_correo(destinatario, "Recupera tu contraseña en ASIS", cuerpo_html)


def correo_alerta_intento_no_valido(destinatario_admin: str, datos_intento: dict) -> None:
    # Convertimos el diccionario a texto legible para el correo
    datos_texto = "<br>".join([f"<strong>{k}:</strong> {v}" for k, v in datos_intento.items()])

    cuerpo_html = f"""
    <html>
      <body style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f0f4f8; margin: 0; padding: 0;">
        <div style="max-width: 600px; margin: 30px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); border-left: 6px solid #D32F2F;">
          
          <!-- Encabezado de Alerta -->
          <div style="background-color: #FFEBEE; color: #C62828; padding: 24px; text-align: center;">
            <h2 style="margin: 0; font-size: 22px; font-weight: 600;">⚠️ Alerta de Seguridad ASIS</h2>
          </div>

          <!-- Cuerpo del mensaje -->
          <div style="padding: 32px 24px; color: #333333;">
            <p style="font-size: 16px; margin-bottom: 20px;">Hola Administrador,</p>
            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
              Se ha intent confirmar o activar una cuenta con datos que no coinciden con ningún registro pre-cargado, o que ya se encuentra activa.
            </p>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; border: 1px solid #e9ecef; margin-bottom: 24px;">
              <p style="margin: 0 0 12px 0; font-weight: bold; color: #555;">Datos del intento:</p>
              <p style="margin: 0; font-size: 14px; line-height: 1.8; color: #333;">
                {datos_texto}
              </p>
            </div>

            <p style="font-size: 15px; line-height: 1.6; color: #555;">
              Por favor, revisa si esto corresponde a un usuario legítimo con un pre-registro mal realizado o a un intento de acceso indebido.
            </p>
          </div>

          <!-- Pie de página -->
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
            <p style="margin: 0; font-size: 13px; color: #888888;">Sistema ASIS - SENA | Módulo de Seguridad</p>
          </div>
        </div>
      </body>
    </html>
    """
    enviar_correo(destinatario_admin, "Alerta ASIS: intento de activación no válido", cuerpo_html)