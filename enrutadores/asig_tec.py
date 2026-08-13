from fastapi import APIRouter, HTTPException, status
from sqlmodel import select

from conexion_db import Sesion_dependencia

from Modelos.asig_tec import Asig_tec,Asig_tecEditar,Asig_tecCrear,Asig_tecBase,Asig_tecLeer


from Modelos.Usuarios import Usuario
from Modelos.roles import Rol


asis = APIRouter(
    prefix="/asignacion",
    tags=["Asignacion Tecnico"]
)


@asis.get("/", response_model=list[Asig_tec])
async def listar_asig(session: Sesion_dependencia):

    lista_asig = session.exec(
        select(Asig_tec)
    ).all()

    return lista_asig



@asis.get("/{id}", response_model=Asig_tec)
async def listar_asig_id(
    id: int,
    session: Sesion_dependencia
):

    asig_bd = session.get(
        Asig_tec,
        id
    )

    if not asig_bd:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"La asignación con ID {id} no existe."
        )

    return asig_bd



@asis.post("/", response_model=Asig_tec)
async def asignar_tecnico_a_ticket(
    datos: Asig_tecCrear,
    sesion: Sesion_dependencia
):

    # Buscar técnico
    usuario = sesion.get(
        Usuario,
        datos.id_tecnico
    )

    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El usuario seleccionado no existe"
        )


    # Validar rol técnico
    rol = sesion.get(
        Rol,
        usuario.id_rol
    )

    if not rol:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El rol del usuario no existe"
        )


    if rol.nombre_rol.lower().strip() != "tecnico":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"No se puede asignar. El usuario tiene rol '{rol.nombre_rol}', se requiere tecnico."
        )


    try:

        nueva_asignacion = Asig_tec.model_validate(datos)

        sesion.add(nueva_asignacion)
        sesion.commit()
        sesion.refresh(nueva_asignacion)

        return nueva_asignacion


    except Exception as e:

        sesion.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al crear asignación: {str(e)}"
        )



@asis.put("/{id}", response_model=Asig_tec)
async def editar_asig(
    id: int,
    datos_asig: Asig_tecEditar,
    session: Sesion_dependencia
):

    asig_bd = session.get(
        Asig_tec,
        id
    )

    if not asig_bd:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"La asignación con ID {id} no existe."
        )


    datos = datos_asig.model_dump(
        exclude_unset=True
    )

    asig_bd.sqlmodel_update(datos)

    session.add(asig_bd)
    session.commit()
    session.refresh(asig_bd)

    return asig_bd



@asis.delete("/{id}", response_model=Asig_tec)
async def eliminar_asig(
    id: int,
    session: Sesion_dependencia
):

    asig_bd = session.get(
        Asig_tec,
        id
    )

    if not asig_bd:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"La asignación con ID {id} no existe."
        )


    session.delete(asig_bd)
    session.commit()

    return asig_bd