"""
accounts.signals
----------------
Post-save hooks for the accounts domain.
"""
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import User


@receiver(post_save, sender=User)
def create_user_welcome(sender, instance, created, **kwargs):
    """
    Placeholder for any post-registration side effects
    (e.g. sending a welcome SMS via Africa's Talking in a future sprint).
    """
    if created:
        pass  # hook ready for Sprint 5
