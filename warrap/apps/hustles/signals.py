"""
hustles.signals
---------------
Post-save signal handlers for tasks.
Flash-Gig notifications will be wired here in Sprint 4.
"""
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Task


@receiver(post_save, sender=Task)
def notify_flash_gig(sender, instance, created, **kwargs):
    """
    When a Flash-Gig is first created, queue a notification
    to nearby users. Notification logic lives in apps.notifications.
    (Wired up properly in Sprint 4.)
    """
    if created and instance.is_flash_gig:
        pass  # Sprint 4: trigger notification service
