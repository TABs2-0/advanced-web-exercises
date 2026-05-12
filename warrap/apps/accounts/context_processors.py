"""
accounts.context_processors
----------------------------
Injects current user's profile data into every template context.
"""


def user_profile(request):
    """Make the authenticated user's extended profile available site-wide."""
    if request.user.is_authenticated:
        return {
            "current_user": request.user,
        }
    return {}
