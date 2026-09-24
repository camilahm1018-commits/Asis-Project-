# servicios/correo.py
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List
import os
from dotenv import load_dotenv

load_dotenv()

def enviar_correo_notificacion(destinatarios: List[str], asunto: str, datos: dict) -> bool:
    """
    Envía un correo HTML con los datos del ticket a los destinatarios.
    """
    if not destinatarios:
        print("⚠️ No hay destinatarios para enviar el correo")
        return False
    
    mensaje = MIMEMultipart()
    mensaje['From'] = os.getenv("CORREO_APP")
    mensaje['To'] = ", ".join(destinatarios)
    mensaje['Subject'] = asunto
    
    cuerpo_html = f"""
    <html>
      <body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #39A900; color: white; padding: 20px; text-align: center;">
          <h2 style="margin: 0;">🚨 Nuevo Ticket Registrado</h2>
        </div>
        <div style="padding: 20px; background-color: #f9f9f9;">
          <p>Hola, se ha generado un nuevo ticket en el sistema ASIS.</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px; background-color: white;">
            <tr style="background-color: #f2f2f2;">
              <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">ID Ticket:</td>
              <td style="padding: 12px; border: 1px solid #ddd;">{datos.get('id_ticket')}</td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Tipo de salida:</td>
              <td style="padding: 12px; border: 1px solid #ddd;">{datos.get('tipo_salida', 'N/A')}</td>
            </tr>
            <tr style="background-color: #f9f9f9;">
              <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Equipo:</td>
              <td style="padding: 12px; border: 1px solid #ddd;">{datos.get('equipo')}</td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Ambiente:</td>
              <td style="padding: 12px; border: 1px solid #ddd;">{datos.get('ambiente')}</td>
            </tr>
            <tr style="background-color: #f9f9f9;">
              <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Motivo:</td>
              <td style="padding: 12px; border: 1px solid #ddd;">{datos.get('motivo')}</td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Reportado por:</td>
              <td style="padding: 12px; border: 1px solid #ddd;">{datos.get('creado_por')}</td>
            </tr>
            <tr style="background-color: #f9f9f9;">
              <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Fecha de salida:</td>
              <td style="padding: 12px; border: 1px solid #ddd;">{datos.get('fecha_salida')}</td>
            </tr>
          </table>
          <div style="margin-top: 20px; padding: 15px; background-color: #e8f5e9; border-left: 4px solid #39A900;">
            <p style="margin: 0; font-size: 14px;">
              <strong>Acción requerida:</strong> Por favor, revise este ticket y tome las acciones necesarias.
            </p>
          </div>
        </div>
        <div style="background-color: #f2f2f2; padding: 15px; text-align: center; font-size: 12px; color: #777;">
          <p style="margin: 0;">Sistema ASIS - SENA</p>
          <p style="margin: 5px 0 0 0;">Este es un correo automático, por favor no responda.</p>
        </div>
      </body>
    </html>
    """
    
    mensaje.attach(MIMEText(cuerpo_html, 'html'))
    
    # 🕵️‍♂️ DEBUG EXTREMO: Esto revelará cualquier carácter oculto
    correo_debug = os.getenv("CORREO_APP")
    clave_debug = os.getenv("CONTRASENA_APP")
    print("="*60)
    print(f"🔍 CORREO LEÍDO: '{correo_debug}'")
    print(f"🔍 CLAVE LEÍDA (repr): {repr(clave_debug)}")
    print(f"🔍 LONGITUD DE LA CLAVE: {len(clave_debug) if clave_debug else 0}")
    print("="*60)
    
    try:
        servidor = smtplib.SMTP(os.getenv("SMTP_SERVER"), int(os.getenv("SMTP_PORT", 587)))
        servidor.starttls()
        servidor.login(os.getenv("CORREO_APP"), os.getenv("CONTRASENA_APP"))
        servidor.send_message(mensaje)
        servidor.quit()
        print(f"✅ Correo enviado a: {', '.join(destinatarios)}")
        return True
    except Exception as e:
        print(f"❌ Error al enviar correo: {e}")
        return False