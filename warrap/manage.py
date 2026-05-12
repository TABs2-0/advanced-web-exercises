#!/usr/bin/env python
"""Django management entry point."""
import os
import sys


def main():
    # Default to dev settings unless explicitly overridden
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "warrap.settings.dev")
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Make sure it is installed and your "
            "virtual environment is activated."
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == "__main__":
    main()
