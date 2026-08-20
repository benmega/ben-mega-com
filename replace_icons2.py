import re

html_file = 'index.html'
with open(html_file, 'r', encoding='utf-8') as f:
    content = f.read()

icon_map = {
    'Python': '<i class="devicon-python-plain colored tag-icon" title="Python"></i>',
    'Flask': '<i class="devicon-flask-original colored tag-icon" title="Flask"></i>',
    'JavaScript': '<i class="devicon-javascript-plain colored tag-icon" title="JavaScript"></i>',
    'React': '<i class="devicon-react-original colored tag-icon" title="React"></i>',
    'Vite': '<i class="devicon-vite-original colored tag-icon" title="Vite"></i>',
    'HTML': '<i class="devicon-html5-plain colored tag-icon" title="HTML"></i>',
    'CSS': '<i class="devicon-css3-plain colored tag-icon" title="CSS"></i>',
    'SQLAlchemy': '<i class="devicon-sqlalchemy-plain tag-icon" title="SQLAlchemy"></i>',
    'Android': '<i class="devicon-android-plain colored tag-icon" title="Android"></i>',
    'Kotlin': '<i class="devicon-kotlin-plain colored tag-icon" title="Kotlin"></i>',
    'SQLite': '<i class="devicon-sqlite-plain colored tag-icon" title="SQLite"></i>',
    'Pygame': '<i class="devicon-python-plain colored tag-icon" title="Pygame"></i>',
    'Nginx': '<i class="devicon-nginx-original colored tag-icon" title="Nginx"></i>',
    'Gunicorn': '<img src="https://cdn.jsdelivr.net/npm/simple-icons@16/icons/gunicorn.svg" alt="Gunicorn" title="Gunicorn" class="tag-icon" style="filter:invert(1);">',
    'AWS': '<i class="devicon-amazonwebservices-plain-wordmark colored tag-icon" title="AWS"></i>',
    'CI/CD': '<i class="devicon-githubactions-plain colored tag-icon" title="CI/CD"></i>',
    'Linux': '<i class="devicon-linux-plain colored tag-icon" title="Linux"></i>',
    'PyTorch': '<i class="devicon-pytorch-original colored tag-icon" title="PyTorch"></i>',
    'OpenAI': '<img src="https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg" alt="OpenAI" title="OpenAI" class="tag-icon" style="filter:invert(1);">',
    'Hugging Face': '<img src="https://cdn.jsdelivr.net/npm/simple-icons@16/icons/huggingface.svg" alt="Hugging Face" title="Hugging Face" class="tag-icon" style="filter:invert(1);">',
    'ComfyUI': '<span class="tag">ComfyUI</span>'
}

def replacer(match):
    # match.group(0) is the entire <span class="tag" style="...">...</span> string
    inner = match.group(1).strip()
    
    # Extract the text from inside the tag. We might have already replaced it!
    # Let's just restore original state first, or parse it out.
    # Actually, in the previous script I left the text like:
    # <span class="tag" style="...">...</i> Python</span>
    # So let's match the text at the end of the tag.
    text_match = re.search(r'([A-Za-z/ ]+)$', inner)
    if text_match:
        tag_name = text_match.group(1).strip()
    else:
        tag_name = inner
        
    return icon_map.get(tag_name, match.group(0))

# Because we modified the tags to have style=... in the previous run, let's match all span class="tag"
new_content = re.sub(r'<span class="tag"[^>]*>(.*?)</span>', replacer, content)

with open(html_file, 'w', encoding='utf-8') as f:
    f.write(new_content)
print('Done!')
