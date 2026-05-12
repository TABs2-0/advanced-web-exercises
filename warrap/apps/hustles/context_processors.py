"""
hustles.context_processors
---------------------------
Injects SITE_META from settings into every template context.
Views can override individual keys by passing them in their own context.
"""
from django.conf import settings


def site_meta(request):
    """
    Makes the full SEO metadata dict available as {{ meta }} in all templates.
    Individual view-level overrides (page title, description, og:image)
    are handled in templates via {% block meta_* %}.
    """
    return {
        "meta": getattr(settings, "SITE_META", {}),
    }
