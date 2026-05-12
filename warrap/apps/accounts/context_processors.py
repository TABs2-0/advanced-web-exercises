"""
accounts.context_processors
----------------------------
Injects current user's profile data into every template context.
"""
from apps.notifications.models import Notification

def user_profile(request):
    """Make the authenticated user's extended profile available site-wide."""
    ctx = {}
    if request.user.is_authenticated:
        ctx["current_user"] = request.user
        ctx["unread_count"] = Notification.objects.filter(
            recipient=request.user, is_read=False
        ).count()
    return ctx
