import re

with open('vite.config.ts', 'r') as f:
    content = f.read()

# Add base: './', inside defineConfig
if "base:" not in content:
    content = re.sub(
        r'(export default defineConfig\(\(\{mode\}\) => \{\n\s+const env = loadEnv\(mode, \'\.\', \'\'\);\n\s+return \{)',
        r"\1\n    base: './',",
        content
    )

with open('vite.config.ts', 'w') as f:
    f.write(content)

print("Updated vite.config.ts")
