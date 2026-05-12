with open('templates/partials/navbar.html', 'r') as f:
    content = f.read()

content = content.replace('\\n{% endif %}', '\n{% endif %}')

with open('templates/partials/navbar.html', 'w') as f:
    f.write(content)
