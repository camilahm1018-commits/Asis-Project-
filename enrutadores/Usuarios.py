from modelos.Usuarios import UsuarioCrear, UsuarioEditar,Usuario
from fastapi import APIRouter, status, HTTPException
from conexion_db import Sesion_dependencia
from sqlmodel import select


app = APIRouter(
    prefix="/usuarios",
    tags=["Usuarios"]
)

@app.get("/usuarios", response_model=list[Usuario])
async def listar_usuarios(sesion: Sesion_dependencia):
    lista_usu = sesion.exec(select(Usuario)).all()
    return lista_usu


@app.get("/usuarios/{id_usuario}", response_model=Usuario)
async def listar_usuario(id_usuario: int, mi_sesion: Sesion_dependencia): # type: ignore

    usuario = mi_sesion.get(Usuario, id_usuario)
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Usuario no encontrado")

    return usuario


@app.post("/usuarios", response_model =Usuario)
async def crear_usuario(datos_usuario: UsuarioCrear,  mi_sesion: Sesion_dependencia): # type: ignore
    nuevo_usuario = Usuario.model_validate(datos_usuario)
    
    nuevo_usuario.id_rol = 1
    
    mi_sesion.add(nuevo_usuario)
    mi_sesion.commit()
    mi_sesion.refresh(nuevo_usuario)
    return nuevo_usuario


@app.patch("/usuarios/{id_usuario}", response_model=Usuario)
async def editar_usuario(id_usuario: int, datos_usuario: UsuarioEditar,  mi_sesion: Sesion_dependencia):

    usuario = mi_sesion.get(Usuario, id_usuario)

    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Usuario no encontrado"
        )


    usuario_dict = datos_usuario.model_dump(exclude_unset=True)
    usuario.sqlmodel_update(usuario_dict)

    mi_sesion.add(usuario)
    mi_sesion.commit()
    mi_sesion.refresh(usuario)

    return usuario
        

@app.delete("/usuarios/{id_usuario}", response_model=Usuario)
async def eliminar_usuario(id_usuario: int, mi_sesion: Sesion_dependencia):

    usuario = mi_sesion.get(Usuario, id_usuario)

    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Usuario no encontrado"
        )

    usuario_eliminado = Usuario.model_validate(usuario)

    mi_sesion.delete(usuario)
    mi_sesion.commit()

    return usuario_eliminado