"""
Management command: expire_tasks
---------------------------------
Run this via cron or a scheduler every 5 minutes:
    python manage.py expire_tasks

Crontab example:
    */5 * * * * /path/to/venv/bin/python /path/to/manage.py expire_tasks >> /var/log/warrap_expire.log 2>&1
"""
from django.core.management.base import BaseCommand

from apps.hustles.services import expire_stale_tasks


class Command(BaseCommand):
    help = "Expire all open tasks that have passed their expiry time."

    def handle(self, *args, **options):
        count = expire_stale_tasks()
        self.stdout.write(self.style.SUCCESS(f"Expired {count} stale task(s)."))
