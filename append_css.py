css_append = '''
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
with open('styles.css', 'a', encoding='utf-8') as f:
    f.write(css_append)
print('Done!')
