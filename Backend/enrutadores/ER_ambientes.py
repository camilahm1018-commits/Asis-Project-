from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import select
from sesiones_roles import Sesion_por_rol
from Modelos.ambientes import Ambiente, AmbienteCrear, AmbienteEditar, AmbienteLeer
from seguridad import verificar_token, solo_admin

asis = APIRouter(prefix="/ambientes", tags=["Ambientes"],
                 dependencies=[Depends(verificar_token)])


def validar_ambiente_propio(sesion, id_ambiente, usuario):
    ambiente = sesion.get(Ambiente, id_ambiente)
    if ambiente is None:
        raise HTTPException(status_code=404, detail="Ambiente no encontrado")
    if usuario["rol"] == "cuentadante" and ambiente.id_cuentadante != usuario["id_usuario"]:
        raise HTTPException(status_code=403, detail="Ambiente fuera de tu responsabilidad")
    return ambiente


@asis.get("/", response_model=list[AmbienteLeer])
async def listar_ambientes(sesion: Sesion_por_rol):
    return sesion.exec(select(Ambiente)).all()


@asis.get("/mis-ambientes", response_model=list[AmbienteLeer])
async def listar_mis_ambientes(sesion: Sesion_por_rol,
                               usuario: dict = Depends(verificar_token)):
    rol = usuario["rol"]
    if rol in ("administrador", "administrador_mesa_ayuda"):
        q = select(Ambiente)
    elif rol == "cuentadante":
        q = select(Ambiente).where(Ambiente.id_cuentadante == usuario["id_usuario"])
    elif rol == "instructor":
        q = select(Ambiente).where(Ambiente.estado == "activo")
    else:
        raise HTTPException(status_code=403, detail="Rol no autorizado")
    return sesion.exec(q).all()


@asis.get("/{id_ambiente}", response_model=AmbienteLeer)
async def obtener_ambiente(id_ambiente: int, sesion: Sesion_por_rol):
    ambiente = sesion.get(Ambiente, id_ambiente)
    if ambiente is None:
        raise HTTPException(status_code=404, detail="Ambiente no encontrado")
    return ambiente


@asis.post("/", response_model=AmbienteLeer)
async def crear_ambiente(datos_ambiente: AmbienteCrear, sesion: Sesion_por_rol,
                         usuario: dict = Depends(verificar_token)):
    if usuario["rol"] not in ("administrador", "cuentadante"):
        raise HTTPException(status_code=403, detail="No autorizado")
    datos = datos_ambiente.model_dump()
    if usuario["rol"] == "cuentadante":
        datos["id_cuentadante"] = usuario["id_usuario"]
    nuevo = Ambiente.model_validate(datos)
    sesion.add(nuevo)
    sesion.commit()
    sesion.refresh(nuevo)
    return nuevo


@asis.put("/{id_ambiente}", response_model=AmbienteLeer)
async def editar_ambiente(id_ambiente: int, datos_ambiente: AmbienteEditar,
                          sesion: Sesion_por_rol,
                          usuario: dict = Depends(verificar_token)):
    if usuario["rol"] not in ("administrador", "cuentadante"):
        raise HTTPException(status_code=403, detail="No autorizado")
    ambiente = validar_ambiente_propio(sesion, id_ambiente, usuario)
    cambios = datos_ambiente.model_dump(exclude_unset=True)
    if usuario["rol"] == "cuentadante" and "id_cuentadante" in cambios and cambios["id_cuentadante"] != usuario["id_usuario"]:
        raise HTTPException(status_code=403, detail="No puedes transferir ambientes")
    ambiente.sqlmodel_update(cambios)
    sesion.add(ambiente)
    sesion.commit()
    sesion.refresh(ambiente)
    return ambiente


@asis.delete("/{id_ambiente}", response_model=AmbienteLeer,
             dependencies=[Depends(solo_admin)])
async def eliminar_ambiente(id_ambiente: int, sesion: Sesion_por_rol):
    ambiente = sesion.get(Ambiente, id_ambiente)
    if ambiente is None:
        raise HTTPException(status_code=404, detail="Ambiente no encontrado")
    eliminado = AmbienteLeer.model_validate(ambiente)
    sesion.delete(ambiente)
    sesion.commit()
    return eliminado
