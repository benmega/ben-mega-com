import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Add 'colored' back to devicon classes if not present
def add_colored(match):
    cls_str = match.group(1)
    if 'colored' not in cls_str:
        cls_str = cls_str.replace('devicon-', 'devicon-') # dummy
        # Just prepend colored after devicon-xxx
        cls_str = re.sub(r'(devicon-[a-zA-Z0-9-]+)', r'\1 colored', cls_str)
    return f'<i class="{cls_str}"'

content = re.sub(r'<i class="([^"]+devicon-[^"]+)"', add_colored, content)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)
print('HTML Done!')

with open('styles.css', 'r', encoding='utf-8') as f:
    css = f.read()

# Completely replace the .tag-icon section at the bottom
idx = css.find('.tag-icon {')
if idx != -1:
    css = css[:idx]

new_css = '''
.tag-icon {
  font-size: 24px;
  height: 24px;
  width: auto;
  display: inline-block;
  vertical-align: middle;
  filter: grayscale(100%) opacity(0.7);
  transition: transform 0.2s ease, filter 0.2s ease;
}

.tag-icon:hover {
  transform: scale(1.1);
  filter: grayscale(0%) opacity(1);
}

img.tag-icon.invert-img {
  filter: invert(0.8) grayscale(100%) opacity(0.7);
}

img.tag-icon.invert-img:hover {
  filter: invert(1) grayscale(0%) opacity(1);
}
'''
css += new_css.strip() + '\n'

with open('styles.css', 'w', encoding='utf-8') as f:
    f.write(css)
print('CSS Done!')
