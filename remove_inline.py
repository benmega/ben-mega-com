with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(' style="filter:invert(1);"', '')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done!')
