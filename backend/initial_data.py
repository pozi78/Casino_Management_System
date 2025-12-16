import asyncio
from sqlalchemy.future import select
from app.db.session import AsyncSessionLocal
from app.models.user import Usuario
from app.core.security import get_password_hash

async def create_initial_data():
    async with AsyncSessionLocal() as session:
        # Seed Roles
        from app.models.user import Rol
        roles_to_create = [
            {"nombre": "Superadministrador", "codigo": "SUPERADMIN"},
            {"nombre": "Administrador", "codigo": "ADMIN"},
            {"nombre": "Operador", "codigo": "OPERATOR"},
            {"nombre": "Usuario", "codigo": "USER"},
        ]
        
        created_roles = {}
        for role_data in roles_to_create:
            result_role = await session.execute(select(Rol).where(Rol.codigo == role_data["codigo"]))
            role = result_role.scalars().first()
            if not role:
                role = Rol(nombre=role_data["nombre"], codigo=role_data["codigo"])
                session.add(role)
                print(f"Role {role_data['nombre']} created")
            created_roles[role_data["codigo"]] = role
        
        await session.commit()
        
        # Check Admin User
        result = await session.execute(select(Usuario).where(Usuario.email == "admin@example.com"))
        user = result.scalars().first()
        
        if not user:
            print("Creating superuser admin@example.com")
            user = Usuario(
                email="admin@example.com",
                username="admin",
                hash_password=get_password_hash("admin"),
                nombre="Administrator",
                activo=True,
                telefono="000000000",
                telegram_user="admin_bot",
                cargo="Superadmin",
                departamento="IT",
                codigo_empleado="ADM001"
            )
            # Assign Superadmin role
            # Need to re-fetch role or use the one we have attached to session (if created) or merged
            # Since we committed, objects might be expired/freed. Let's re-fetch specifically or just append strictly
            # Easiest is to append to the list if relationship is loaded, or set list
            # But async relationship assignment can be tricky on new objects.
            session.add(user)
            await session.commit()
            await session.refresh(user)
            user.roles.append(created_roles["SUPERADMIN"])
            await session.commit()
            print("Superuser created")
        else:
            # OPTIONAL: Ensure existing admin has role?
            # Load roles
            from sqlalchemy.orm import selectinload
            result = await session.execute(
                select(Usuario).options(selectinload(Usuario.roles)).where(Usuario.id == user.id)
            )
            user = result.scalars().first()
            if not user.roles:
                 user.roles.append(created_roles["SUPERADMIN"])
                 await session.commit()
                 print("Assigned Superadmin role to existing admin")
            print("Superuser already exists")

if __name__ == "__main__":
    asyncio.run(create_initial_data())
