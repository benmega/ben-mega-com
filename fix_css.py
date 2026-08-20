with open('styles.css', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the existing tag-icon style
old_css = '''
.tag-icon {
  font-size: 24px;
  height: 24px;
  width: auto;
  display: inline-block;
  vertical-align: middle;
  transition: transform 0.2s ease;
}

.tag-icon:hover {
  transform: scale(1.1);
}
'''

new_css = '''
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
  filter: grayscale(100%) opacity(0.7) invert(1);
}

.tag-icon:hover {
  transform: scale(1.1);
  color: #fff;
}

img.tag-icon:hover {
  filter: grayscale(0%) opacity(1) invert(0);
}
'''

if '.tag-icon {' in content:
    content = content.replace(old_css.strip(), new_css.strip())
else:
    content += '\n' + new_css.strip()

with open('styles.css', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done!')
