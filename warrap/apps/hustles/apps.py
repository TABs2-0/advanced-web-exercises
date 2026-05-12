from django.apps import AppConfig
from django.utils.translation import gettext_lazy as _


class HustlesConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.hustles"
    verbose_name = _("Hustles")

    def ready(self):
        import apps.hustles.signals  # noqa: F401
