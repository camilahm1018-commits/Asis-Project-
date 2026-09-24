import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List
import os
from dotenv import load_dotenv

load_dotenv()


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