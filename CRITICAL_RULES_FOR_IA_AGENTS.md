# Reglas Críticas para Agentes de IA

Este documento contiene las reglas inquebrantables para el desarrollo y mantenimiento del proyecto *CasinosSM*. Todo agente de IA debe leer, comprender y seguir estas normas estrictamente.

## Base de Datos
1.  **NO ELIMINAR LA BASE DE DATOS COMPLETA**:
    *   **NUNCA** ejecutar comandos de borrado total (`drop_all`, `reset_db`) para aplicar cambios.
    *   Para modificaciones de esquema, **alterar solo las tablas afectadas** mediante migraciones o sentencias SQL (`ALTER TABLE`).
    *   Preservar siempre los datos existentes.

## Docker y Entorno
2.  **Debugging vía Logs de Docker**:
    *   Para diagnosticar errores, **siempre** revisar los logs de los contenedores Docker.
    *   Consultar `docker-compose.yml` para identificar los nombres de los servicios y contenedores correctos (ej: `casinosm-backend`, `casinosm-frontend`).
    *   Comando típico: `docker logs <nombre-contenedor>`.

3.  **Ejecución de Comandos**:
    *   Los comandos de gestión, scripts de python, migraciones, etc., deben ejecutarse **DENTRO** de los contenedores Docker pertinentes.
    *   Usar `docker exec <nombre-contenedor> <comando>` o entrar al contenedor con `docker exec -it <nombre-contenedor> bash`.
    *   No ejecutar comandos que dependan del entorno del proyecto directamente en el host si deberían correr en el entorno contenerizado.
