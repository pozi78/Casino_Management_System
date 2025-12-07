import asyncio
from app.db.session import engine
from app.db.base_class import Base
from app.models.salon import Salon

async def reset_db():
    async with engine.begin() as conn:
        # Be careful here, dropping Salon table to force schema update
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    print("Database reset complete.")

if __name__ == "__main__":
    asyncio.run(reset_db())
