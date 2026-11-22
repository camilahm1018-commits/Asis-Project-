-- Ejecutar SOLO cuando cambias las contraseñas ASIS_DB_* de un volumen existente.
-- Precisa que las variables estén inyectadas en el contenedor db.
\getenv auth_pass ASIS_DB_AUTH_PASSWORD
\getenv admin_pass ASIS_DB_ADMIN_PASSWORD
\getenv inst_pass ASIS_DB_INSTRUCTOR_PASSWORD
\getenv tec_pass ASIS_DB_TECNICO_PASSWORD
\getenv mesa_pass ASIS_DB_MESA_PASSWORD
\getenv cuent_pass ASIS_DB_CUENTADANTE_PASSWORD
ALTER ROLE asis_app_auth PASSWORD :'auth_pass';
ALTER ROLE asis_app_admin PASSWORD :'admin_pass';
ALTER ROLE asis_app_instructor PASSWORD :'inst_pass';
ALTER ROLE asis_app_tecnico PASSWORD :'tec_pass';
ALTER ROLE asis_app_mesa PASSWORD :'mesa_pass';
ALTER ROLE asis_app_cuentadante PASSWORD :'cuent_pass';
