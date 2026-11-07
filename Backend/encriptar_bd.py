from sqlmodel import Session, create_engine, select
from Modelos.Usuarios import Usuario
from seguridad import encriptar_contrasena

url_bd = "postgresql://postgres:1234@localhost:5432/asisdb"
motor_bd = create_engine(url_bd)

with Session(motor_bd) as sesion:
    usuarios = sesion.exec(select(Usuario)).all()
    for usuario in usuarios:
        usuario.contrasena_u = encriptar_contrasena(usuario.contrasena_u)
        sesion.add(usuario)
    sesion.commit()
    print(f" {len(usuarios)} contraseñas encriptadas correctamente")