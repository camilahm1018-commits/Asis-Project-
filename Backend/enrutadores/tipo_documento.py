from fastapi import Depends
from seguridad import verificar_token, solo_admin
from fastapi import APIRouter, HTTPException, status
from Modelos.tipo_documento import Tipo_identificacion,Tipo_identificacionCrear,Tipo_identificacionEditar
from sesiones_roles import Sesion_por_rol
from sqlmodel import select

asis = APIRouter(
    dependencies=[Depends(verificar_token)],
    prefix="/Tipo_identificacion",
    tags=["Tipo_identificacion"]
)

@asis.get("/", response_model=list[Tipo_identificacion])
async def listar_Tipo_identificacion(session: Sesion_por_rol):
    listTipo_identificacion = session.exec(select(Tipo_identificacion)).all()
    return listTipo_identificacion


@asis.get("/{id_tipo_id}", response_model=Tipo_identificacion)
async def listar_Tipo_identificacion_id(id_tipo_id: int, session: Sesion_por_rol):
    Tipo_identificacion_bd = session.get(Tipo_identificacion, id_tipo_id)
    if not Tipo_identificacion_bd:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail= f"El Tippo de identificación con ID {id}, no existe.")
    return Tipo_identificacion_bd


@asis.post("/", response_model=Tipo_identificacion, dependencies=[Depends(solo_admin)])
async def crear_Tipo_identificacion(datos_Tipo_identificacion: Tipo_identificacionCrear, session: Sesion_por_rol):
    Tipo_identificacion_validado = Tipo_identificacion.model_validate(
        datos_Tipo_identificacion.model_dump()
    )
    
    session.add(Tipo_identificacion_validado)
    session.commit()
    session.refresh(Tipo_identificacion_validado)
    return Tipo_identificacion_validado

@asis.put("/{id_tipo_id}", response_model=Tipo_identificacion, dependencies=[Depends(solo_admin)])
async def editar_Tipo_identificacion(id_tipo_id: int, datos_Tipo_identificacion: Tipo_identificacionEditar, session: Sesion_por_rol):

    Tipo_identificacion_bd = session.get(Tipo_identificacion, id_tipo_id)
    if not Tipo_identificacion_bd:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail= f"El Tipo de identificación con ID {id_tipo_id}, no existe.")
    Tipo_identificacion_dict = datos_Tipo_identificacion.model_dump(exclude_unset=True)
    Tipo_identificacion_bd.sqlmodel_update(Tipo_identificacion_dict)

    session.add(Tipo_identificacion_bd)
    session.commit()
    session.refresh(Tipo_identificacion_bd)
    return Tipo_identificacion_bd

@asis.delete("/{id_tipo_id}", response_model=Tipo_identificacion, dependencies=[Depends(solo_admin)])
async def eliminar_Tipo_identificacion(id_tipo_id: int, session: Sesion_por_rol):
    Tipo_identificacion_bd = session.get(Tipo_identificacion, id_tipo_id)

    if not Tipo_identificacion_bd:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail= f"El Tipo de identificación con ID {id_tipo_id}, no existe.")

    session.delete(Tipo_identificacion_bd)
    session.commit()
    return Tipo_identificacion_bd