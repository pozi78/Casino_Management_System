
# Guía de Despliegue Remoto - Casino Management System

Este documento detalla cómo desplegar el entorno de desarrollo en tu servidor remoto Ubuntu (`172.16.101.5`).

## Prerrequisitos en el Servidor
- **Docker** y **Docker Compose** deben estar instalados.
- Usuario: `miguel`.
- Directorio destino: `/opt/CasinoSM-dev`.

## Pasos para el Despliegue

### 1. Copiar Archivos al Servidor
Desde tu máquina local (Windows), abre PowerShell y usa `scp` para copiar todo el proyecto. Asegúrate de estar en `C:\Users\usuario\Documents\Projects\Python\Salones`.

```powershell
# Excluye node_modules y __pycache__ para hacer la copia más rápida (opcional pero recomendado)
# Si no tienes un zip, copia carpeta por carpeta o usa rsync si tienes WSL.
# Opción simple con SCP recursivo:

scp -r . miguel@172.16.101.5:/opt/CasinoSM-dev
```
*Nota: Es posible que necesites permisos de escritura en `/opt`. Si falla, copia a `/home/miguel/CasinoSM-dev` y luego mueve los archivos con `sudo`.*

### 2. Conectarse y Levantar Contenedores
Conéctate por SSH:

```bash
ssh miguel@172.16.101.5
cd /opt/CasinoSM-dev
```

Levanta los servicios con Docker Compose:

```bash
# Construir y levantar en segundo plano
docker compose up --build -d
```

### 3. Inicializar Base de Datos (Primera vez)
Una vez levantado, necesitas crear las tablas y el usuario administrador dentro del contenedor del backend.

```bash
# Ejecutar el script de reset e inicialización dentro del contenedor backend
docker compose exec backend python reset_db.py
docker compose exec backend python initial_data.py
```

### 4. Acceso
- **Frontend**: http://172.16.101.5:5173
- **Backend API**: http://172.16.101.5:8000/docs
- **Credenciales por defecto**: `admin@example.com` / `admin`

## Tips Desarrollo Remoto
Como hemos configurado `volumes` en el `docker-compose.yml`, cualquier cambio que hagas en los archivos de `/opt/CasinoSM-dev` en el servidor se reflejará automáticamente gracias al hot-reloading de Uvicorn y Vite.

Puedes conectar tu VS Code local al servidor usando la extensión **Remote - SSH** para editar ficheros directamente en el servidor.
