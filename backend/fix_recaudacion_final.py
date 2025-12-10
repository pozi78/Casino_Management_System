import re

file_path = "/opt/CasinosSM/frontend/src/pages/RecaudacionDetail.tsx"

with open(file_path, "r") as f:
    lines = f.readlines()

# 1. Fix handleConfirmImport
# We look for the function start
start_idx = -1
end_idx = -1

for i, line in enumerate(lines):
    if "const handleConfirmImport = async () => {" in line:
        start_idx = i
        break

if start_idx != -1:
    # Find the closing brace for this function. 
    # It should be a lines with "    };" at indentation level 4.
    for i in range(start_idx + 1, len(lines)):
        if lines[i].strip() == "};":
            end_idx = i
            break

if start_idx != -1 and end_idx != -1:
    print(f"Found handleConfirmImport at {start_idx}-{end_idx}")
    
    clean_body = """    const handleConfirmImport = async () => {
        if ((!importFile && !analyzingFileId) || !recaudacion || !analysisResults) return;

        setIsUploading(true);
        try {
            if (analyzingFileId) {
                // Manually call import-excel with file_id
                const formData = new FormData();
                formData.append('mappings_str', JSON.stringify(userMappings));
                formData.append('file_id', String(analyzingFileId));
                
                // Using axios directly or I should update the API wrapper. 
                await axios.post(`/recaudaciones/${recaudacion.id}/import-excel`, formData);

            } else if (importFile) {
                await recaudacionApi.importExcel(recaudacion.id, importFile, userMappings);
            }

            setImportModalOpen(false);
            setImportFile(null);
            setAnalyzingFileId(null);
            fetchData(recaudacion.id);
            // alert("Importación completada");
        } catch (err) {
            console.error(err);
            alert("Error al importar el archivo.");
        } finally {
            setIsUploading(false);
        }
    };
"""
    # Create new lines list with replaced content
    # We replace lines[start_idx : end_idx + 1]
    # But clean_body is a string, we split it.
    body_lines = [l + "\n" for l in clean_body.split("\n") if l] 
    # The split might lose newlines, let's just make sure
    body_lines = [l + "\n" for l in clean_body.splitlines()]
    
    lines = lines[:start_idx] + body_lines + lines[end_idx+1:]
else:
    print("Could not find handleConfirmImport range.")

# 2. Remove Duplicate Import Modal
# Find all occurrences of the modal start
modal_start_pattern = "{importModalOpen && analysisResults && ("
modal_starts = []

for i, line in enumerate(lines):
    if modal_start_pattern in line:
        modal_starts.append(i)

print(f"Found {len(modal_starts)} modal blocks.")

if len(modal_starts) > 1:
    # We remove the FIRST one.
    first_start = modal_starts[0]
    # Find where it ends. It ends with "        )}" usually.
    # Looking for the matching indentation/bracket.
    
    first_end = -1
    # Simple heuristic: scan until the next line that is just "        )}" or "        )} "
    for i in range(first_start, len(lines)):
        if lines[i].strip() == ")}": # Likely indentation 8 spaces
             # Check if it looks like the end of the modal
             # The modal has a closing `div` then `)` then `}` likely.
             # Actually the pattern is:
             #      ...
             #      </div>
             #  )}
             first_end = i
             # Ensure this end is before the SECOND start
             if first_end < modal_starts[1]:
                 break
    
    if first_end != -1:
        print(f"Removing duplicate modal at {first_start}-{first_end}")
        # Remove these lines
        del lines[first_start : first_end+1]
    else:
        print("Could not identify end of first modal block.")

with open(file_path, "w") as f:
    f.writelines(lines)

print("File updated.")
