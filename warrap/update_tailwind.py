import re

with open('theme/static_src/tailwind.config.js', 'r') as f:
    content = f.read()

animation_addition = '''
                " bounce-in\:
