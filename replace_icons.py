import re

html_file = 'index.html'
with open(html_file, 'r', encoding='utf-8') as f:
    content = f.read()

head_link = '  <link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/devicon.min.css">\n</head>'
if 'devicon.min.css' not in content:
    content = content.replace('</head>', head_link)

icon_map = {
    'Python': '<i class="devicon-python-plain colored tag-icon" title="Python"></i> Python',
    'Flask': '<i class="devicon-flask-original colored tag-icon" title="Flask"></i> Flask',
    'JavaScript': '<i class="devicon-javascript-plain colored tag-icon" title="JavaScript"></i> JavaScript',
    'React': '<i class="devicon-react-original colored tag-icon" title="React"></i> React',
    'Vite': '<i class="devicon-vite-original colored tag-icon" title="Vite"></i> Vite',
    'HTML': '<i class="devicon-html5-plain colored tag-icon" title="HTML"></i> HTML',
    'CSS': '<i class="devicon-css3-plain colored tag-icon" title="CSS"></i> CSS',
    'SQLAlchemy': '<i class="devicon-sqlalchemy-plain colored tag-icon" title="SQLAlchemy"></i> SQLAlchemy',
    'Android': '<i class="devicon-android-plain colored tag-icon" title="Android"></i> Android',
    'Kotlin': '<i class="devicon-kotlin-plain colored tag-icon" title="Kotlin"></i> Kotlin',
    'SQLite': '<i class="devicon-sqlite-plain colored tag-icon" title="SQLite"></i> SQLite',
    'Pygame': '<i class="devicon-python-plain colored tag-icon" title="Pygame"></i> Pygame',
    'Nginx': '<i class="devicon-nginx-original colored tag-icon" title="Nginx"></i> Nginx',
    'Gunicorn': '<img src="https://cdn.jsdelivr.net/npm/simple-icons@16/icons/gunicorn.svg" alt="Gunicorn" title="Gunicorn" class="tag-icon" style="height:1em; filter:invert(1); vertical-align:middle;"> Gunicorn',
    'AWS': '<i class="devicon-amazonwebservices-plain-wordmark colored tag-icon" title="AWS"></i> AWS',
    'CI/CD': '<i class="devicon-githubactions-plain colored tag-icon" title="CI/CD"></i> CI/CD',
    'Linux': '<i class="devicon-linux-plain colored tag-icon" title="Linux"></i> Linux',
    'PyTorch': '<i class="devicon-pytorch-original colored tag-icon" title="PyTorch"></i> PyTorch',
    'OpenAI': '<img src="https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg" alt="OpenAI" title="OpenAI" class="tag-icon" style="height:1em; filter:invert(1); vertical-align:middle;"> OpenAI',
    'Hugging Face': '<img src="https://cdn.jsdelivr.net/npm/simple-icons@16/icons/huggingface.svg" alt="Hugging Face" title="Hugging Face" class="tag-icon" style="height:1em; filter:invert(1); vertical-align:middle;"> Hugging Face',
    'ComfyUI': '<span class="tag">ComfyUI</span>'
}

def replacer(match):
    tag_name = match.group(1).strip()
    icon_html = icon_map.get(tag_name, tag_name)
    if tag_name in icon_map and tag_name != 'ComfyUI':
        return f'<span class="tag" style="display:inline-flex; align-items:center; gap:4px; font-size:14px;">{icon_html}</span>'
    return match.group(0)

new_content = re.sub(r'<span class="tag">(.*?)</span>', replacer, content)

with open(html_file, 'w', encoding='utf-8') as f:
    f.write(new_content)
print('Done!')
