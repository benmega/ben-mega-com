with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    'class="tag-icon"',
    'class="tag-icon invert-img"'
).replace(
    'class="tag-icon invert-img">',
    'class="tag-icon">', 
) # Wait, this is error prone. Let's use re.

import re
def img_replacer(match):
    img_tag = match.group(0)
    if 'comfyui' in img_tag.lower():
        return img_tag
    if 'class="tag-icon"' in img_tag:
        return img_tag.replace('class="tag-icon"', 'class="tag-icon invert-img"')
    return img_tag

content = re.sub(r'<img [^>]+>', img_replacer, content)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)
print('HTML Done!')

with open('styles.css', 'r', encoding='utf-8') as f:
    css = f.read()

# Replace the img.tag-icon rules
css = re.sub(r'img\.tag-icon \{.*?\}', '', css, flags=re.DOTALL)
css = re.sub(r'img\.tag-icon:hover \{.*?\}', '', css, flags=re.DOTALL)

css += '''
img.tag-icon {
  filter: grayscale(100%) opacity(0.7);
}
img.tag-icon.invert-img {
  filter: invert(0.8) opacity(0.7);
}
img.tag-icon:hover {
  filter: grayscale(0%) opacity(1);
}
img.tag-icon.invert-img:hover {
  filter: invert(1) opacity(1);
}
'''
with open('styles.css', 'w', encoding='utf-8') as f:
    f.write(css)
print('CSS Done!')
