"""
Warrap — Root URL configuration
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.conf.urls.i18n import i18n_patterns
from apps.hustles.views import root_view

admin.site.has_permission = lambda request: request.user.is_active and request.user.is_superuser

urlpatterns = [
    path("i18n/", include("django.conf.urls.i18n")),
]

urlpatterns += i18n_patterns(
    path("admin/", admin.site.urls),
    # django-allauth handles: login, signup, logout, password reset, Google OAuth
    path("accounts/", include("allauth.urls")),
    # Warrap profile views
    path("u/", include("apps.accounts.urls", namespace="accounts")),
    path("hustles/", include("apps.hustles.urls", namespace="hustles")),
    path("notifications/", include("apps.notifications.urls", namespace="notifications")),
    # Root → live map
    path("", root_view, name="home"),
    prefix_default_language=False,
)

if settings.DEBUG:
    urlpatterns += [
        path("__reload__/", include("django_browser_reload.urls")),
    ]
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
