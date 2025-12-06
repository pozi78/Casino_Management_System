import asyncio
from sqlalchemy.future import select
from app.db.session import AsyncSessionLocal
from app.models.user import Usuario
from app.core.security import get_password_hash

async def debug_user():
    async with AsyncSessionLocal() as session:
        # Check if user exists
        result = await session.execute(select(Usuario).where(Usuario.email == "admin@example.com"))
        user = result.scalars().first()
        
        if user:
            print(f"User found: {user.email}, ID: {user.id}")
            print(f"Current Hash: {user.hash_password}")
            
            # Reset password to ensure it matches 'admin'
            new_hash = get_password_hash("admin")
            user.hash_password = new_hash
            session.add(user)
            await session.commit()
            print("Password has been reset to 'admin'")
        else:
            print("User NOT found. Creating...")
            user = Usuario(
                email="admin@example.com",
                username="admin",
                hash_password=get_password_hash("admin"),
                nombre="Administrator",
                activo=True
            )
            session.add(user)
            await session.commit()
            print("User created with password 'admin'")

if __name__ == "__main__":
    asyncio.run(debug_user())
