import asyncio
import os
import sys
from sqlalchemy import text

# Add backend to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.session import engine

async def reset_recaudaciones():
    print("Resetting all Recaudacion tables...")
    async with engine.begin() as conn:
        # Use TRUNCATE CASCADE to clean everything, restarting identity (IDs back to 1)
        print("Executing TRUNCATE...")
        try:
            await conn.execute(text("TRUNCATE TABLE recaudacion_fichero, recaudacion_concepto_extra, recaudacion_maquina, recaudacion, maquina_excel_map RESTART IDENTITY CASCADE;"))
            print("Truncate successful.")
        except Exception as e:
            print(f"Error during truncate: {e}")
            
    # Clean Disk
    import shutil
    
    # Old Uploads
    uploads_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads", "recaudaciones")
    if os.path.exists(uploads_dir):
        print(f"Cleaning old uploads directory: {uploads_dir}")
        shutil.rmtree(uploads_dir)
        os.makedirs(uploads_dir, exist_ok=True)
        
    # New Documents
    documents_dir = "/opt/CasinosSM/documents"
    if os.path.exists(documents_dir):
        print(f"Cleaning documents directory: {documents_dir}")
        shutil.rmtree(documents_dir)
        os.makedirs(documents_dir, exist_ok=True)

if __name__ == "__main__":
    asyncio.run(reset_recaudaciones())
