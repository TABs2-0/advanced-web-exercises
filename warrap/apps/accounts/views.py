"""
accounts.views
--------------
Profile and vouch views only.
All auth (login, signup, logout, password reset, social auth)
is handled by django-allauth — no need to reimplement.
"""
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404, redirect, render
from django.utils.translation import gettext_lazy as _

from .forms import EditProfileForm
from .models import User, Vouch
from . import services


def profile_view(request, username: str):
    """Public profile page for any user."""
    profile_user = get_object_or_404(User, username=username)
    recent_tasks = services.get_user_completed_tasks(profile_user, limit=6)
    analytics = services.get_user_activity_analytics(profile_user)
    vouches_received = (
        Vouch.objects.filter(vouchee=profile_user)
        .select_related("voucher")
        .order_by("-created_at")[:5]
    )
    can_vouch = False
    already_vouched = False
    if request.user.is_authenticated and request.user != profile_user:
        can_vouch = services.can_user_vouch(request.user, profile_user)
        already_vouched = Vouch.objects.filter(
            voucher=request.user, vouchee=profile_user
        ).exists()

    return render(request, "accounts/profile.html", {
        "profile_user": profile_user,
        "recent_tasks": recent_tasks,
        "analytics": analytics,
        "vouches_received": vouches_received,
        "can_vouch": can_vouch,
        "already_vouched": already_vouched,
    })


@login_required
def edit_profile_view(request):
    if request.method == "POST":
        form = EditProfileForm(request.POST, request.FILES, instance=request.user)
        if form.is_valid():
            form.save()
            messages.success(request, _("Profile updated. Looking fresh."))
            return redirect("accounts:profile", username=request.user.username)
    else:
        form = EditProfileForm(instance=request.user)
    return render(request, "accounts/edit_profile.html", {"form": form})


@login_required
def vouch_view(request, username: str):
    if request.method != "POST":
        return redirect("accounts:profile", username=username)
    vouchee = get_object_or_404(User, username=username)
    try:
        services.create_vouch(voucher=request.user, vouchee=vouchee)
        messages.success(request, _(f"You vouched for @{vouchee.username}. Good look!"))
    except services.VouchError as e:
        messages.error(request, str(e))
    return redirect("accounts:profile", username=username)
