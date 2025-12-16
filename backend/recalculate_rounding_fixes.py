
import asyncio
import logging
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.api.v1.endpoints.recaudaciones import recalculate_tasa_diferencia
from app.models.recaudacion import Recaudacion

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def main():
    logger.info("Starting recalculation of all recaudaciones...")
    
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Recaudacion.id))
        ids = result.scalars().all()
        
        logger.info(f"Found {len(ids)} recaudaciones to process.")
        
        for rec_id in ids:
            try:
                logger.info(f"Processing Recaudacion ID: {rec_id}")
                await recalculate_tasa_diferencia(db, rec_id)
            except Exception as e:
                logger.error(f"Error processing {rec_id}: {e}")
                
        logger.info("All done.")

if __name__ == "__main__":
    asyncio.run(main())
