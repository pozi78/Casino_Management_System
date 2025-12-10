import re

file_path = "/opt/CasinosSM/frontend/src/pages/RecaudacionDetail.tsx"

with open(file_path, "r") as f:
    content = f.read()

# Fix URL spaces
# Flexible regex: `/ \s* recaudaciones \s* / \s* ${
# We want to replace it with `/recaudaciones/${ 
# We target the whole string up to ${
pattern = r"`\s*/\s*recaudaciones\s*/\s*\$\{"
replacement = "`/recaudaciones/${"

new_content, count = re.subn(pattern, replacement, content)

if count > 0:
    print(f"Fixed {count} occurrences of URL spaces.")
else:
    print("No URL space matches found (Regex failed?).")

# Indentation Fix
pattern_indent = r'(\} else if \(importFile\) \{\n)\s*(await recaudacionApi\.importExcel\(.*?\);\n)\s*(\})'
def fix_indent(match):
    return f"{match.group(1)}                {match.group(2).strip()}\n            {match.group(3)}"

new_content, indent_count = re.subn(pattern_indent, fix_indent, new_content, flags=re.DOTALL)
if indent_count > 0:
    print(f"Fixed {indent_count} indentation issues.")

with open(file_path, "w") as f:
    f.write(new_content)
