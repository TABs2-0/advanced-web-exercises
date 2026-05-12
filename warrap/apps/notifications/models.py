"""
notifications.models
--------------------
In-app notification record.
Sprint 4 will wire the full push notification flow.
"""
from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _


class Notification(models.Model):
    class KindChoices(models.TextChoices):
        TASK_CLAIMED   = "task_claimed",   _("Your task was claimed")
        FLASH_GIG      = "flash_gig",      _("Flash-Gig nearby")
        RATING_REQUEST = "rating_request", _("You have a rating to submit")
        VOUCH_RECEIVED = "vouch_received", _("Someone vouched for you")
        GENERAL        = "general",        _("General")

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
        verbose_name=_("recipient"),
    )
    kind = models.CharField(_("kind"), max_length=20, choices=KindChoices.choices)
    title = models.CharField(_("title"), max_length=120)
    body = models.TextField(_("body"), max_length=300, blank=True)
    url = models.CharField(_("URL"), max_length=200, blank=True)
    is_read = models.BooleanField(_("read"), default=False)
    created_at = models.DateTimeField(_("created at"), auto_now_add=True)

    class Meta:
        verbose_name = _("notification")
        verbose_name_plural = _("notifications")
        ordering = ["-created_at"]

    def __str__(self):
        return f"[{self.kind}] → {self.recipient}: {self.title}"
