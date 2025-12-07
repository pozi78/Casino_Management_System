import asyncio
from sqlalchemy.future import select
from app.db.session import AsyncSessionLocal
from app.models.user import Usuario
from app.core.security import get_password_hash

async def create_initial_data():
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Usuario).where(Usuario.email == "admin@example.com"))
        user = result.scalars().first()
        
        if not user:
            print("Creating superuser admin@example.com")
            user = Usuario(
                email="admin@example.com",
                username="admin",
                hash_password=get_password_hash("admin"),
                nombre="Administrator",
                activo=True
            )
            session.add(user)
            await session.commit()
            print("Superuser created")
        else:
            print("Superuser already exists")

if __name__ == "__main__":
    asyncio.run(create_initial_data())
