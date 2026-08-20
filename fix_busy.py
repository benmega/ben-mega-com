import re

html_file = 'index.html'
with open(html_file, 'r', encoding='utf-8') as f:
    content = f.read()

# Remove 'colored ' from devicon classes
content = content.replace('colored ', '')

# Add the ComfyUI icon
content = content.replace(
    '<span class="tag">ComfyUI</span>',
    '<img src="assets/comfyui.png" alt="ComfyUI" title="ComfyUI" class="tag-icon">'
)

with open(html_file, 'w', encoding='utf-8') as f:
    f.write(content)
print('Done!')
