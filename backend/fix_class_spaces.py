import re

file_path = "/opt/CasinosSM/frontend/src/pages/RecaudacionDetail.tsx"

with open(file_path, "r") as f:
    content = f.read()

# Pattern: Matches "word - word" inside a string context roughly.
# Since these are specific Tailwind classes, we can be aggressive about " - " replacement
# checks.
# text - sm -> text-sm
# font - bold -> font-bold
# w - 32 -> w-32
# px - 2 -> px-2
# py - 1 -> py-1
# ...

# We will regex replace `(\w+)\s-\s(\w+)` with `\1-\2`
# We run it multiple times to catch things like "text - gray - 500" if that existed (though tailwind is usually text-gray-500)
# But wait, "text - gray - 500" might appear as "text - gray" then "gray - 500".
# Let's verify.

def fix_spaces(text):
    # Fix 1: "text - sm" -> "text-sm"
    # Matches letter/digit space hyphen space letter/digit
    pattern = r'([a-zA-Z0-9]+)\s-\s([a-zA-Z0-9]+)'
    
    # We might need to run this until no changes, because "border - gray - 200"
    # 1st pass: "border-gray - 200"
    # 2nd pass: "border-gray-200"
    
    prev_text = text
    for _ in range(5): # Max 5 passes
        new_text = re.sub(pattern, r'\1-\2', prev_text)
        if new_text == prev_text:
            break
        prev_text = new_text
    return prev_text

new_content = fix_spaces(content)

# Also fix the weird spaces inside template literals `${ ... }`
# `${ getColorClass(splitTotal) } ` -> `${getColorClass(splitTotal)}`
# Pattern: `\${\s+` -> `${` and `\s+}` -> `}` inside ...
# Actually, extra spaces inside `${ }` are valid JS, but let's clean them up for consistency if we want.
# The user error was "Missing semicolon" at the start of `${`.
# `<span className={`text-sm font-bold ${ ... } `}>`
# The previous valid code was `<span className={`text-sm font-bold ${getColorClass(splitTotal)}`}>`
# My "bad" code: `<span className={`text - sm font - bold ${ getColorClass(splitTotal) } `}>`

# Let's just fix the hyphens first, that is the most broken part visually and functionally.

with open(file_path, "w") as f:
    f.write(new_content)

print("Fixed spaces in class names.")
