with open('templates/partials/navbar.html', 'r') as f:
    content = f.read()

# remove {% if not hide_nav %} blocks
content = content.replace('{% if not hide_nav %}\\n', '')
content = content.replace('\\n{% endif %}\\n', '\\n')
content = content.replace('\\n{% endif %}', '')

with open('templates/partials/navbar.html', 'w') as f:
    f.write(content)
