import re

with open('warrap/urls.py', 'r') as f:
    content = f.read()

content = content.replace('from apps.hustles.views import map_view', 'from apps.hustles.views import root_view')
content = content.replace('path(" \,
