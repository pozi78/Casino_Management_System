from fastapi import APIRouter
from app.api.v1.endpoints import login, users, salones, machines

api_router = APIRouter()
api_router.include_router(login.router, tags=["login"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(salones.router, prefix="/salones", tags=["salones"])
api_router.include_router(machines.router, prefix="/maquinas", tags=["maquinas"])
