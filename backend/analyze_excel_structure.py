
import pandas as pd
import sys

file_path = "/opt/CasinosSM/excel muestra recaudación.xlsx"
# Note: Path inside container might be different depending on volume mount.
# But 'backend' volume is mounted at /app ?
# The file is in root /opt/CasinosSM on User's OS.
# Docker backend container mounts /opt/CasinosSM/backend as /app (usually).
# So the file is NOT visible to the backend container unless I copy it or mount it.
# I will assume I can't access it from backend container easily unless I copy it to backend/ folder.

# But wait, Step 1375 found it in /opt/CasinosSM/excel muestra recaudación.xlsx
# I should move it to /opt/CasinosSM/backend/ to analyze it.

def analyze():
    # Attempt to read
    try:
        xl = pd.ExcelFile("excel muestra recaudación.xlsx")
        print(f"Sheet Names: {xl.sheet_names}")
        
        for sheet in xl.sheet_names:
            print(f"\n--- Sheet: {sheet} ---")
            # Read all
            df = pd.read_excel(xl, sheet, header=None)
            
            print("\nRows 40-50 Dump:")
            subset = df.iloc[40:51]
            print(subset.to_string())
            for keyword in ["RETIRADA", "CAJON", "PAGO", "IMPUESTOS", "DPS", "PUESTO", "MAQUINA"]:
                found = False
                for r_idx, row in df.iterrows():
                    for c_idx, val in enumerate(row):
                        if str(val) != "nan" and keyword in str(val).upper():
                            print(f"{keyword} found at Row {r_idx}, Col {c_idx}: {val}")
                            found = True
                if not found:
                    print(f"{keyword} NOT found in first 20 rows.")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    analyze()
