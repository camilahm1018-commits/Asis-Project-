from sqlmodel import Session

from Modelos.Usuarios import Usuario
from Modelos.notificaciones import Notificacion
from servicios.sms import enviar_sms


def avisar_evento_ticket(
    sesion: Session,
    id_ticket: int,
    id_autor: int,
    destinatarios: list[Usuario | None],
    mensaje: str,
) -> None:
    usuarios = {
        usuario.id_usuario: usuario
        for usuario in destinatarios
        if usuario is not None and usuario.activo
    }
    if not usuarios:
        return

    sesion.add_all([
        Notificacion(
            canal="app",
            mensaje=mensaje,
            id_ticket=id_ticket,
            notificado_para=id_usuario,
            notificado_por=id_autor,
        )
        for id_usuario in usuarios
    ])
    telefonos = [usuario.telefono_u for usuario in usuarios.values()]
    sesion.commit()
    # El SMS usa los datos ya leídos y no retiene la transacción.
    enviar_sms(telefonos, mensaje)
