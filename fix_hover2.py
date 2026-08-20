import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

def add_colored(match):
    cls_str = match.group(1)
    if 'colored' not in cls_str:
        cls_str = re.sub(r'(devicon-[-a-zA-Z0-9]+)', r'\1 colored', cls_str)
    return f'<i class="{cls_str}"'

content = re.sub(r'<i class="([^"]+)"', add_colored, content)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)
print('HTML Done!')
