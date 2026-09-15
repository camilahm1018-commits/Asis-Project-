from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime
import os
import re

asis = APIRouter(prefix="/contacto", tags=["Contacto"])

class MensajeContacto(BaseModel):
    nombre: str
    correo: str
    mensaje: str

@asis.post("/")
async def recibir_mensaje_contacto(data: MensajeContacto):
    try:
        # Validar que el correo termine en @sena.edu.co
        if not data.correo.lower().endswith('@sena.edu.co'):
            raise HTTPException(
                status_code=400, 
                detail="Solo se aceptan correos institucionales del SENA (@sena.edu.co)"
            )
        
        # Validar formato básico de correo
        if not re.match(r'^[A-Za-z0-9._%+-]+@sena\.edu\.co$', data.correo):
            raise HTTPException(
                status_code=400, 
                detail="El formato del correo institucional no es válido"
            )
        
        # Crear carpeta si no existe
        os.makedirs("mensajes_contacto", exist_ok=True)
        fecha = datetime.now().strftime("%Y%m%d_%H%M%S")
        archivo = f"mensajes_contacto/mensaje_{fecha}.txt"
        
        with open(archivo, "w", encoding="utf-8") as f:
            f.write(f"=== NUEVO MENSAJE DE CONTACTO ===\n")
            f.write(f"Fecha: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}\n")
            f.write(f"Nombre: {data.nombre}\n")
            f.write(f"Correo: {data.correo}\n")
            f.write(f"\nMENSAJE:\n{data.mensaje}\n")
            f.write(f"==============================\n")
        
        return {"mensaje": "Mensaje recibido correctamente"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))