import re

file_path = "/opt/CasinosSM/frontend/src/pages/RecaudacionDetail.tsx"

with open(file_path, "r") as f:
    content = f.read()

# Fix 1: className={ text - ... } -> className={`text-...`}
# Pattern: className={([^`}]*)\${
# This is tricky.
# Let's look for specific patterns seen in logs.
# className={text - sm ... ${
# className={text - xl ... ${

# We'll use a regex to find className={...} blocks that contain dynamic parts but have bad syntax.

def fix_line(line):
    # Check if line has className={ and contains ${ but no backticks at start
    if 'className={' in line and '${' in line:
        # Check if it lacks backticks
        if 'className={`' not in line and "className={' " not in line:
            # It's likely the broken pattern: className={text - sm ... ${ ... } }
            # We want to wrap the content inside {} with backticks
            # AND fix the spaces around hyphens in the text part.
            
            # Extract content inside {}
            # Assuming simple one-liner for now based on error logs
            match = re.search(r'className={(.*?)}', line)
            if match:
                inner = match.group(1)
                # Fix spaces around hyphens: "text - sm" -> "text-sm", "w - 32" -> "w-32"
                # Regex: (\w+) - (\w+) -> \1-\2
                fixed_inner = re.sub(r'(\w+)\s-\s(\w+)', r'\1-\2', inner)
                fixed_inner = re.sub(r'(\w+)\s-\s(\w+)', r'\1-\2', fixed_inner) # Run twice for multiple
                
                # Check if it needs backticks. If it has ${}, it needs backticks.
                if '${' in fixed_inner and not fixed_inner.startswith('`'):
                     fixed_inner = f"`{fixed_inner}`"
                
                line = line.replace(f"{{{inner}}}", f"{{{fixed_inner}}}")
    return line

lines = content.split('\n')
fixed_lines = [fix_line(l) for l in lines]

new_content = '\n'.join(fixed_lines)

# Fix 2: Also check for just "text - sm" without dynamic parts if any (though usually dynamic was the trigger for manual replacement failure?)
# The log showed `className={greenClass}` which is fine.
# `className={manual > 0 ? redClass : 'text-gray-900'}` fine.

with open(file_path, "w") as f:
    f.write(new_content)

print("Fixed Syntax.")
