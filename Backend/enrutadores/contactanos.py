from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime
import os
import re
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

asis = APIRouter(prefix="/contacto", tags=["Contacto"])

class MensajeContacto(BaseModel):
    nombre: str
    correo: str
    categoria: str
    mensaje: str

@asis.post("/")
async def recibir_mensaje_contacto(data: MensajeContacto):
    try:
        # Validaciones de correo
        if not data.correo.lower().endswith('@sena.edu.co'):
            raise HTTPException(status_code=400, detail="Solo se aceptan correos institucionales del SENA (@sena.edu.co)")
        
        if not re.match(r'^[A-Za-z0-9._%+-]+@sena\.edu\.co$', data.correo):
            raise HTTPException(status_code=400, detail="El formato del correo institucional no es válido")
        
        correo_grupo = os.getenv("GRUPO_ASIS_CORREO")
        if not correo_grupo:
            raise HTTPException(status_code=500, detail="No está configurado el correo del grupo en el .env")
        
        smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        smtp_port = int(os.getenv("SMTP_PORT", 587))
        smtp_user = os.getenv("SMTP_USER")
        smtp_password = os.getenv("SMTP_PASS")
        smtp_from = os.getenv("SMTP_FROM", smtp_user)
        
        msg = MIMEMultipart()
        msg['From'] = smtp_from
        msg['To'] = correo_grupo
        msg['Subject'] = f"📩 {data.categoria} Nuevo mensaje de contacto de {data.nombre}"
        
        # DISEÑO HTML AZUL PARA EL CORREO
        cuerpo_html = f"""
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <!-- Encabezado azul oscuro -->
            <div style="background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%); color: white; padding: 30px; text-align: center;">
                <h2 style="margin: 0; font-size: 26px; font-weight: bold;">📩 Nuevo Mensaje de Contacto</h2>
                <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">Sistema ASIS</p>
            </div>
            
            <!-- Cuerpo del mensaje -->
            <div style="padding: 30px; background-color: #ffffff; color: #333333;">
                <p style="font-size: 16px; margin-bottom: 25px; color: #475569;">Hola, has recibido un nuevo mensaje desde el formulario de contacto:</p>
                
                <!-- Tabla de información -->
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
                    <tr>
                        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-weight: bold; width: 30%; color: #1e3a8a;">👤 Nombre:</td>
                        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; color: #334155;">{data.nombre}</td>
                    </tr>
                    <tr>
                        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #1e3a8a;">✉️ Correo:</td>
                        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;"><a href="mailto:{data.correo}" style="color: #2563eb; text-decoration: none; font-weight: 500;">{data.correo}</a></td>
                    </tr>
                    <tr>
                        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #1e3a8a;">📌 Categoría:</td>
                        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;"><span style="background-color: #dbeafe; color: #1e40af; padding: 6px 12px; border-radius: 6px; font-size: 13px; font-weight: 600;">{data.categoria}</span></td>
                    </tr>
                    <tr>
                        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #1e3a8a;">🕒 Fecha:</td>
                        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; color: #64748b;">{datetime.now().strftime('%d/%m/%Y %H:%M:%S')}</td>
                    </tr>
                </table>

                <!-- Caja del mensaje -->
                <div style="background-color: #f8fafc; padding: 20px; border-left: 4px solid #2563eb; border-radius: 8px; margin-top: 20px;">
                    <p style="margin: 0 0 10px 0; font-weight: bold; color: #1e3a8a; font-size: 14px;">💬 Mensaje:</p>
                    <p style="margin: 0; line-height: 1.6; color: #334155; white-space: pre-wrap; font-size: 15px;">{data.mensaje}</p>
                </div>
            </div>
            
            <!-- Pie de página azul claro -->
            <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
                <p style="margin: 0; font-size: 12px; color: #64748b;">Este es un mensaje automático del sistema ASIS.</p>
                <p style="margin: 5px 0 0 0; font-size: 11px; color: #94a3b8;">No responder a este correo.</p>
            </div>
        </div>
        """
        
        msg.attach(MIMEText(cuerpo_html, 'html', 'utf-8'))
        
        try:
            server = smtplib.SMTP(smtp_server, smtp_port)
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.send_message(msg)
            server.quit()
            return {"mensaje": "Mensaje enviado correctamente al equipo de ASIS"}
        except Exception as email_error:
            raise HTTPException(status_code=500, detail=f"Error al enviar el correo: {str(email_error)}")
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")