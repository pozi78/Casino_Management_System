# Casino Management System

## Descripción
Sistema integral de gestión para salones de juego (Arcade Management System). Esta aplicación permite administrar usuarios, salones de juego, máquinas recreativas y recaudaciones de manera eficiente y segura.

## Características Principales
- **Gestión de Salones**: Creación, edición y administración de diferentes salones de juego.
- **Gestión de Usuarios**: Sistema robusto de usuarios con roles y permisos (Administradores, Gestores, Operarios).
- **Gestión de Máquinas**: Inventario y control de máquinas recreativas.
- **Seguridad**: Autenticación JWT y control de acceso basado en roles.

## Tecnologías Utilizadas

### Backend
- **Lenguaje**: Python 3.10+
- **Framework**: FastAPI
- **Base de Datos**: PostgreSQL
- **ORM**: SQLAlchemy (con Alembic para migraciones)
- **Autenticación**: PyJWT, Passlib (bcrypt)

### Frontend
- **Framework**: React (con Vite)
- **Lenguaje**: TypeScript
- **Estilos**: CSS Modules / Vanilla CSS

## Estructura del Proyecto
```
/
├── backend/        # API RESTful con FastAPI
│   ├── app/        # Lógica de la aplicación
│   ├── alembic/    # Migraciones de base de datos
│   └── ...
├── frontend/       # Aplicación Web React
│   ├── src/        # Componentes y páginas
│   └── ...
└── ...
```

## Configuración y Despliegue

### Requisitos Previos
- Python 3.10 o superior
- Node.js 18 o superior
- PostgreSQL

### Instalación Backend
1.  Navega al directorio backend:
    ```bash
    cd backend
    ```
2.  Crea un entorno virtual e instálalo:
    ```bash
    python -m venv venv
    source venv/bin/activate  # En Windows: venv\Scripts\activate
    pip install -r requirements.txt
    ```
3.  Configura las variables de entorno (`.env`) y ejecuta las migraciones:
    ```bash
    alembic upgrade head
    ```
4.  Inicia el servidor:
    ```bash
    uvicorn app.main:app --reload
    ```

### Instalación Frontend
1.  Navega al directorio frontend:
    ```bash
    cd frontend
    ```
2.  Instala las dependencias:
    ```bash
    npm install
    ```
3.  Inicia el servidor de desarrollo:
    ```bash
    npm run dev
    ```
