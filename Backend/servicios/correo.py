import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List
import os
from dotenv import load_dotenv

load_dotenv()

#Esteban
def enviar_correo_notificacion(destinatarios: List[str], asunto: str, datos: dict) -> bool:
    if not destinatarios:
        print("No hay destinatarios para enviar el correo")
        return False

    mensaje = MIMEMultipart()
    mensaje["From"] = os.getenv("CORREO_APP")
    mensaje["To"] = ", ".join(destinatarios)
    mensaje["Subject"] = asunto

    cuerpo_html = f"""
    <html>
      <body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #39A900; color: white; padding: 20px; text-align: center;">
          <h2 style="margin: 0;">Nuevo Ticket Registrado</h2>
        </div>
        <div style="padding: 20px; background-color: #f9f9f9;">
          <p>Hola, se ha generado un nuevo ticket en el sistema ASIS.</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px; background-color: white;">
            <tr style="background-color: #f2f2f2;">
              <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">ID Ticket:</td>
              <td style="padding: 12px; border: 1px solid #ddd;">{datos.get('id_ticket')}</td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Equipo:</td>
              <td style="padding: 12px; border: 1px solid #ddd;">{datos.get('equipo')}</td>
            </tr>
            <tr style="background-color: #f9f9f9;">
              <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Ambiente:</td>
              <td style="padding: 12px; border: 1px solid #ddd;">{datos.get('ambiente')}</td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Motivo:</td>
              <td style="padding: 12px; border: 1px solid #ddd;">{datos.get('motivo')}</td>
            </tr>
            <tr style="background-color: #f9f9f9;">
              <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Reportado por:</td>
              <td style="padding: 12px; border: 1px solid #ddd;">{datos.get('creado_por')}</td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Fecha de salida:</td>
              <td style="padding: 12px; border: 1px solid #ddd;">{datos.get('fecha_salida')}</td>
            </tr>
          </table>
          <div style="margin-top: 20px; padding: 15px; background-color: #e8f5e9; border-left: 4px solid #39A900;">
            <p style="margin: 0; font-size: 14px;">
              <strong>Accion requerida:</strong> Por favor, revise este ticket y tome las acciones necesarias.
            </p>
          </div>
        </div>
        <div style="background-color: #f2f2f2; padding: 15px; text-align: center; font-size: 12px; color: #777;">
          <p style="margin: 0;">Sistema ASIS - SENA</p>
        </div>
      </body>
    </html>
    """

    mensaje.attach(MIMEText(cuerpo_html, "html"))

    try:
        servidor = smtplib.SMTP(os.getenv("SMTP_SERVER"), int(os.getenv("SMTP_PORT", 587)))
        servidor.starttls()
        servidor.login(os.getenv("CORREO_APP"), os.getenv("CONTRASENA_APP"))
        servidor.send_message(mensaje)
        servidor.quit()
        print(f"Correo de CREACION enviado a: {', '.join(destinatarios)}")
        return True
    except Exception as e:
        print(f"Error al enviar correo de creacion: {e}")
        return False


def enviar_correo_cambio_estado(destinatarios: List[str], asunto: str, datos: dict) -> bool:
    if not destinatarios:
        print("No hay destinatarios para enviar el correo de cambio de estado")
        return False

    mensaje = MIMEMultipart()
    mensaje["From"] = os.getenv("CORREO_APP")
    mensaje["To"] = ", ".join(destinatarios)
    mensaje["Subject"] = asunto

    color_estado = datos.get("color_estado", "#39A900")

    cuerpo_html = f"""
    <html>
      <body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
        <div style="background-color: {color_estado}; color: white; padding: 20px; text-align: center;">
          <h2 style="margin: 0;">Cambio de Estado en Ticket</h2>
        </div>
        <div style="padding: 20px; background-color: #f9f9f9;">
          <p>Hola, el estado de un ticket ha sido actualizado.</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px; background-color: white;">
            <tr style="background-color: #f2f2f2;">
              <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">ID Ticket:</td>
              <td style="padding: 12px; border: 1px solid #ddd;">{datos.get('id_ticket')}</td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Equipo:</td>
              <td style="padding: 12px; border: 1px solid #ddd;">{datos.get('equipo')}</td>
            </tr>
            <tr style="background-color: #f9f9f9;">
              <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Ambiente:</td>
              <td style="padding: 12px; border: 1px solid #ddd;">{datos.get('ambiente')}</td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Estado anterior:</td>
              <td style="padding: 12px; border: 1px solid #ddd;">{datos.get('estado_anterior')}</td>
            </tr>
            <tr style="background-color: #f9f9f9;">
              <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Estado nuevo:</td>
              <td style="padding: 12px; border: 1px solid #ddd; color: {color_estado}; font-weight: bold;">{datos.get('estado_nuevo')}</td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Motivo del ticket:</td>
              <td style="padding: 12px; border: 1px solid #ddd;">{datos.get('motivo')}</td>
            </tr>
          </table>
          <div style="margin-top: 20px; padding: 15px; background-color: #e8f5e9; border-left: 4px solid {color_estado};">
            <p style="margin: 0; font-size: 14px;">
              <strong>Informacion:</strong> El ticket ha cambiado de estado. Por favor, revise los detalles.
            </p>
          </div>
        </div>
        <div style="background-color: #f2f2f2; padding: 15px; text-align: center; font-size: 12px; color: #777;">
          <p style="margin: 0;">Sistema ASIS - SENA</p>
        </div>
      </body>
    </html>
    """

    mensaje.attach(MIMEText(cuerpo_html, "html"))

    try:
        servidor = smtplib.SMTP(os.getenv("SMTP_SERVER"), int(os.getenv("SMTP_PORT", 587)))
        servidor.starttls()
        servidor.login(os.getenv("CORREO_APP"), os.getenv("CONTRASENA_APP"))
        servidor.send_message(mensaje)
        servidor.quit()
        print(f"Correo de CAMBIO DE ESTADO enviado a: {', '.join(destinatarios)}")
        return True
    except Exception as e:
        print(f"Error al enviar correo de cambio de estado: {e}")
        return False
      
      
def enviar_correo_asignacion(destinatarios: List[str], asunto: str, datos: dict) -> bool:
    """Envía correo cuando se ASIGNA un ticket a un técnico."""
    if not destinatarios:
        print("No hay destinatarios para enviar el correo de asignacion")
        return False

    mensaje = MIMEMultipart()
    mensaje["From"] = os.getenv("CORREO_APP")
    mensaje["To"] = ", ".join(destinatarios)
    mensaje["Subject"] = asunto

    cuerpo_html = f"""
    <html>
      <body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #1976D2; color: white; padding: 20px; text-align: center;">
          <h2 style="margin: 0;">👨‍💻 Nuevo Ticket Asignado</h2>
        </div>
        <div style="padding: 20px; background-color: #f9f9f9;">
          <p>Hola, se te ha asignado un nuevo ticket para resolver.</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px; background-color: white;">
            <tr style="background-color: #f2f2f2;">
              <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">ID Ticket:</td>
              <td style="padding: 12px; border: 1px solid #ddd;">{datos.get('id_ticket')}</td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Equipo:</td>
              <td style="padding: 12px; border: 1px solid #ddd;">{datos.get('equipo')}</td>
            </tr>
            <tr style="background-color: #f9f9f9;">
              <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Ambiente:</td>
              <td style="padding: 12px; border: 1px solid #ddd;">{datos.get('ambiente')}</td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Motivo:</td>
              <td style="padding: 12px; border: 1px solid #ddd;">{datos.get('motivo')}</td>
            </tr>
            <tr style="background-color: #f9f9f9;">
              <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Reportado por:</td>
              <td style="padding: 12px; border: 1px solid #ddd;">{datos.get('reportado_por')}</td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Asignado por:</td>
              <td style="padding: 12px; border: 1px solid #ddd;">{datos.get('asignado_por')}</td>
            </tr>
            <tr style="background-color: #f9f9f9;">
              <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Fecha de asignacion:</td>
              <td style="padding: 12px; border: 1px solid #ddd;">{datos.get('fecha_asignacion')}</td>
            </tr>
          </table>
          <div style="margin-top: 20px; padding: 15px; background-color: #E3F2FD; border-left: 4px solid #1976D2;">
            <p style="margin: 0; font-size: 14px;">
              <strong>Accion requerida:</strong> Por favor, revisa el ticket y comienza con la reparacion lo antes posible.
            </p>
          </div>
        </div>
        <div style="background-color: #f2f2f2; padding: 15px; text-align: center; font-size: 12px; color: #777;">
          <p style="margin: 0;">Sistema ASIS - SENA</p>
          <p style="margin: 5px 0 0 0;">Este es un correo automatico, por favor no responda.</p>
        </div>
      </body>
    </html>
    """

    mensaje.attach(MIMEText(cuerpo_html, "html"))

    try:
        servidor = smtplib.SMTP(os.getenv("SMTP_SERVER"), int(os.getenv("SMTP_PORT", 587)))
        servidor.starttls()
        servidor.login(os.getenv("CORREO_APP"), os.getenv("CONTRASENA_APP"))
        servidor.send_message(mensaje)
        servidor.quit()
        print(f"Correo de ASIGNACION enviado a: {', '.join(destinatarios)}")
        return True
    except Exception as e:
        print(f"Error al enviar correo de asignacion: {e}")
        return False
      

#Camila      
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