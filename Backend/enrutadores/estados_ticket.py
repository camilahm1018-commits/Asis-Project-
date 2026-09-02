from Modelos.estados_ticket import estados_ticket,estados_ticketCrear, estados_ticketEditar
from fastapi import APIRouter, status, HTTPException
from conexion_db import Sesion_dependencia
from sqlmodel import select


asis = APIRouter(
    prefix="/estados_ticket",
    tags=["Estados de Tickets"]
)

@asis.get("/estados_ticket", response_model=list[estados_ticket])
async def listar_estados_ticket(sesion: Sesion_dependencia):
    lista_estados = sesion.exec(select(estados_ticket)).all()
    return lista_estados


@asis.get("/estados_ticket/{id_estado}", response_model=estados_ticket)
async def listar_estado_ticket(id_estado: int, mi_sesion: Sesion_dependencia): # type: ignore

    estado = mi_sesion.get(estados_ticket, id_estado)
    if not estado:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Estado de ticket no encontrado")

    return estado


@asis.post("/estados_ticket", response_model =estados_ticket)
async def crear_estado_ticket(datos_estado: estados_ticketCrear,  mi_sesion: Sesion_dependencia): # type: ignore
    nuevo_estado = estados_ticket.model_validate(datos_estado)
    
    mi_sesion.add(nuevo_estado)
    mi_sesion.commit()
    mi_sesion.refresh(nuevo_estado)
    return nuevo_estado


@asis.put("/estados_ticket/{id_estado}", response_model=estados_ticket)
async def editar_estado_ticket(id_estado: int, datos_estado: estados_ticketEditar,  mi_sesion: Sesion_dependencia):

    estado = mi_sesion.get(estados_ticket, id_estado)

    if not estado:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Estado de ticket no encontrado"
        )


    estado_dict = datos_estado.model_dump(exclude_unset=True)
    estado.sqlmodel_update(estado_dict)

    mi_sesion.add(estado)
    mi_sesion.commit()
    mi_sesion.refresh(estado)

    return estado
        

@asis.delete("/estados_ticket/{id_estado}", response_model=estados_ticket)
async def eliminar_estado_ticket(id_estado: int, mi_sesion: Sesion_dependencia):

    estado = mi_sesion.get(estados_ticket, id_estado)

    if not estado:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Estado de ticket no encontrado"
        )

    estado_eliminado = estados_ticket.model_validate(estado)

    mi_sesion.delete(estado)
    mi_sesion.commit()

    return estado_eliminado