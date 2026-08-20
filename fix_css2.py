with open('styles.css', 'r', encoding='utf-8') as f:
    content = f.read()

import re
# Find the new tag-icon class and replace it
content = re.sub(r'\.tag-icon \{.*?(?=\n\S)', '''
.tag-icon {
  font-size: 24px;
  height: 24px;
  width: auto;
  display: inline-block;
  vertical-align: middle;
  color: #a0a0a0; /* Neutral gray for font icons */
  transition: transform 0.2s ease, color 0.2s ease, filter 0.2s ease;
}

img.tag-icon {
  filter: grayscale(100%) brightness(200%) opacity(0.7);
}

.tag-icon:hover {
  transform: scale(1.1);
  color: #fff;
}

img.tag-icon:hover {
  filter: grayscale(0%) brightness(100%) opacity(1);
}
''', content, flags=re.DOTALL)

with open('styles.css', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done!')
