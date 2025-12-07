# PROMPT DE CONTINUACIÓN DE PROYECTO (ANTIGRAVITY)

## Contexto del Proyecto
Estás recibiendo un proyecto existente llamado **Casino/Arcade Management System**.
El objetivo es un sistema completo para la gestión de salones de juego, máquinas y recaudaciones.

## Stack Tecnológico
- **Backend**: Python 3.11+, FastAPI, SQLAlchemy (Async), PostgreSQL, Pydantic v2.
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide React, Axios.
- **Infraestructura**: Docker y Docker Compose para despliegue (ver `docker-compose.yml` y `DEPLOY_REMOTE.md`).

## Estado Actual del Desarrollo
Hasta este momento se ha implementado:

1.  **Infraestructura Base**:
    - Configuración de base de datos (Alembic/SQLAlchemy).
    - Autenticación JWT (Login/Registro/Usuarios).
    - Sistema de Roles y Permisos (básico).

2.  **Módulo: Salones**:
    - CRUD completo de Salones (Crear, Editar, Listar, Eliminar).
    - Ordenación por ID en listados.

3.  **Módulo: Máquinas**:
    - Modelos `TipoMaquina` y `Maquina`.
    - CRUD completo en Backend y Frontend.
    - **Refactorización Reciente**: Se han eliminado los campos `codigo` y `codigo_interno` de toda la aplicación por petición del usuario. Las máquinas se identifican principalmente por su ID y Número de Serie opcional.

4.  **Despliegue**:
    - Archivos `Dockerfile` para backend y frontend.
    - `docker-compose.yml` funcional.
    - Guía `DEPLOY_REMOTE.md` para despliegue en servidor Ubuntu.

## Instrucciones para el Nuevo Agente
Para continuar el trabajo donde se dejó, sigue estos pasos estrictamente:

1.  **Exploración Inicial**:
    - Lee `task.md` situado en `.gemini/antigravity/brain/...` (o búscalo en la raíz si se ha movido) para ver la lista de tareas pendientes.
    - Lee `implementation_plan.md` para entender el plan técnico actual.
    - Revisa `backend/app/models` para entender el esquema de datos actual.

2.  **Verificación de Estado**:
    - Confirma que el backend arranca y conecta a la BD.
    - Confirma que el frontend compila.
    - **Nota**: Si usas entorno local, ejecuta `python reset_db.py` y `python initial_data.py` en `backend/` si necesitas limpiar la base de datos tras la refactorización de esquemas.

3.  **Siguiente Objetivo: Recaudaciones (Revenue Management)**
    - La próxima gran tarea es implementar el módulo de **Recaudaciones**.
    - Ya existen modelos preliminares en `backend/app/models/recaudacion.py`.
    - Debes implementar:
        - Schemas Pydantic.
        - CRUD con lógica de "Auto-Inicialización" (al crear una recaudación, generar líneas para todas las máquinas activas del salón).
        - Endpoints API.
        - Frontend: Pantalla de listado y formulario de entrada de contadores ("Wizard" o tabla editable).

## Comandos Útiles
- **Backend Local**: `cd backend && uvicorn app.main:app --reload`
- **Frontend Local**: `cd frontend && npm run dev`
- **Docker**: `docker compose up --build`
