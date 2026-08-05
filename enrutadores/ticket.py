from fastapi import APIRouter, HTTPException, status
from modelos.tickets import *
from conexion_db import Sesion_dependencia
from sqlmodel import select

asis = APIRouter(
    prefix="/tickets",
    tags=["Tickets"]
)

@asis.get("/", response_model=list[tickets])
async def listar_tickets(session: Sesion_dependencia):
    listTi = session.exec(select(tickets)).all()
    return listTi

@asis.get("/{id}", response_model=tickets)
async def listar_tickets_id(id: str, session: Sesion_dependencia):
    tik_bd = session.get(tickets, id)
    if not tik_bd:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail= f"El ticket con ID {id}, no existe.")
    return tik_bd

@asis.post("/", response_model=tickets)
async def crear_ticket(datos_tik: TicketsCrear, session: Sesion_dependencia):
    tik_validado = tickets.model_validate(
        datos_tik.model_dump()
    )
    
    session.add(tik_validado)
    session.commit()
    session.refresh(tik_validado)
    return tik_validado

@asis.patch("/{id}", response_model=tickets)
async def editar_ticket(id: str, datos_tik: TicketsEditar, session: Sesion_dependencia):
    tik_bd = session.get(tickets, id)
    if not tik_bd:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail= f"El Rol con ID {id}, no existe.")
    tik_dict = datos_tik.model_dump(exclude_unset=True)
    tik_bd.sqlmodel_update(tik_dict)
        
    session.add(tik_bd)
    session.commit()
    session.refresh(tik_bd)
    return tik_bd

@asis.delete("/{id}", response_model=tickets)
async def eliminar_ticket(id: str, session: Sesion_dependencia):
    tik_bd = session.get(tickets, id)
    
    if not tik_bd:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail= f"El Rol con ID {id}, no existe.")
    
    session.delete(tik_bd)
    session.commit()
    return tik_bd
    