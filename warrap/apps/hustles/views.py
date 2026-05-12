"""
hustles.views
-------------
Map, task CRUD, claim, complete, rate, leaderboard.
Views are intentionally thin — all logic delegates to services.py.
"""
import json

from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from django.views.decorators.http import require_POST

from .forms import PostTaskForm, RatingForm
from .models import Task, TaskCategoryChoices
from . import services


# ---------------------------------------------------------------------------
# Main map
# ---------------------------------------------------------------------------

def root_view(request):
    """Route to map if logged in, landing page if not."""
    if request.user.is_authenticated:
        return redirect("hustles:map")
    return render(request, "hustles/landing.html", {
        "categories": TaskCategoryChoices.choices,
    })

def map_view(request):
    """
    The homepage — a Leaflet map with task pins.
    Actual pins are loaded by the JS via /api/hustles/nearby/.
    """
    categories = TaskCategoryChoices.choices
    return render(request, "hustles/map.html", {
        "categories": categories,
        "default_city_coords": {"lat": 3.848, "lng": 11.502},
        "task_detail_url_template": request.build_absolute_uri(
            reverse("hustles:task_detail", kwargs={"pk": 0})
        ).replace("/0/", "/{id}/"),
    })


# ---------------------------------------------------------------------------
# Nearby tasks API (Leaflet JSON feed)
# ---------------------------------------------------------------------------

def nearby_tasks_api(request):
    """
    GET /api/hustles/nearby/?lat=X&lng=Y&category=digital
    Returns JSON array of task pins for Leaflet.
    """
    try:
        lat = float(request.GET.get("lat", 3.848))
        lng = float(request.GET.get("lng", 11.502))
    except (TypeError, ValueError):
        return JsonResponse({"error": "Invalid coordinates"}, status=400)

    category = request.GET.get("category", "")
    radius = request.GET.get("radius", None)
    if radius:
        try:
            radius = int(radius)
        except ValueError:
            radius = None

    tasks = services.get_nearby_tasks(
        latitude=lat,
        longitude=lng,
        radius_m=radius,
        category=category if category else None,
    )
    return JsonResponse({"tasks": tasks})


# ---------------------------------------------------------------------------
# Task detail
# ---------------------------------------------------------------------------

def task_detail_view(request, pk: int):
    task = get_object_or_404(Task, pk=pk)
    is_party = request.user.is_authenticated and request.user in (task.poster, task.claimer)
    reveal_location = is_party and task.status in (Task.StatusChoices.CLAIMED, Task.StatusChoices.COMPLETED)
    suggested_tasks = (
        Task.objects.filter(
            status=Task.StatusChoices.OPEN,
            expires_at__gt=timezone.now(),
        )
        .exclude(pk=task.pk)
        .select_related("poster")
        .order_by("-is_flash_gig", "-created_at")[:6]
    )

    return render(request, "hustles/task_detail.html", {
        "task": task,
        "reveal_location": reveal_location,
        "is_poster": request.user == task.poster if request.user.is_authenticated else False,
        "is_claimer": request.user == task.claimer if request.user.is_authenticated else False,
        "suggested_tasks": suggested_tasks,
    })


# ---------------------------------------------------------------------------
# Post a task
# ---------------------------------------------------------------------------

@login_required
def post_task_view(request):
    if request.method == "POST":
        form = PostTaskForm(request.POST)
        if form.is_valid():
            try:
                task = services.create_task(
                    poster=request.user,
                    title=form.cleaned_data["title"],
                    description=form.cleaned_data["description"],
                    category=form.cleaned_data["category"],
                    pay=form.cleaned_data["pay"],
                    latitude=form.cleaned_data["latitude"],
                    longitude=form.cleaned_data["longitude"],
                    required_people=form.cleaned_data["required_people"],
                    is_flash_gig=form.cleaned_data["is_flash_gig"],
                    neighborhood=form.cleaned_data.get("neighborhood", ""),
                    hours_until_expiry=form.cleaned_data.get("hours_until_expiry", 24),
                )
                messages.success(request, _("Hustle posted! It is live on the map."))
                return redirect("hustles:task_detail", pk=task.pk)
            except Exception as e:
                messages.error(request, str(e))
    else:
        form = PostTaskForm()

    return render(request, "hustles/post_task.html", {"form": form})


# ---------------------------------------------------------------------------
# Claim
# ---------------------------------------------------------------------------

@login_required
@require_POST
def claim_task_view(request, pk: int):
    try:
        task = services.claim_task(task_id=pk, claimer=request.user)
        messages.success(request, _("Locked! Check the task details for contact info."))
        return redirect("hustles:task_detail", pk=task.pk)
    except services.AlreadyClaimedError as e:
        messages.warning(request, str(e))
    except services.HustleError as e:
        messages.error(request, str(e))

    return redirect("hustles:task_detail", pk=pk)


# ---------------------------------------------------------------------------
# Complete
# ---------------------------------------------------------------------------

@login_required
@require_POST
def complete_task_view(request, pk: int):
    try:
        task, badge_awarded = services.complete_task(task_id=pk, requesting_user=request.user)
        if badge_awarded and getattr(task.claimer, "badge", None):
            messages.success(request, _(f"You just earned the {task.claimer.get_badge_display()} badge!"))
        messages.success(request, _("Task marked complete. Now go rate each other!"))
        return redirect("hustles:rate_task", pk=task.pk)
    except services.HustleError as e:
        messages.error(request, str(e))
    return redirect("hustles:task_detail", pk=pk)


# ---------------------------------------------------------------------------
# Rate
# ---------------------------------------------------------------------------

@login_required
def rate_task_view(request, pk: int):
    task = get_object_or_404(Task, pk=pk)

    if request.user not in (task.poster, task.claimer):
        messages.error(request, _("You are not a party in this task."))
        return redirect("hustles:map")

    ratee = task.claimer if request.user == task.poster else task.poster

    if request.method == "POST":
        form = RatingForm(request.POST)
        if form.is_valid():
            try:
                services.submit_rating(
                    task_id=pk,
                    rater=request.user,
                    ratee=ratee,
                    score=form.cleaned_data["score"],
                    comment=form.cleaned_data.get("comment", ""),
                )
                messages.success(request, _("Rating submitted. Street Cred updated."))
                return redirect("accounts:profile", username=ratee.username)
            except services.HustleError as e:
                messages.error(request, str(e))
    else:
        form = RatingForm()

    return render(request, "hustles/rate_task.html", {"task": task, "ratee": ratee, "form": form})


# ---------------------------------------------------------------------------
# Leaderboard
# ---------------------------------------------------------------------------

def leaderboard_view(request):
    city = request.GET.get("city", "")
    leaders = services.get_weekly_leaderboard(city=city)
    return render(request, "hustles/leaderboard.html", {
        "leaders": leaders,
        "city": city,
    })


# ---------------------------------------------------------------------------
# My tasks
# ---------------------------------------------------------------------------

@login_required
def my_tasks_view(request):
    posted = Task.objects.filter(poster=request.user).order_by("-created_at")[:20]
    claimed = Task.objects.filter(claimer=request.user).order_by("-updated_at")[:20]
    return render(request, "hustles/my_tasks.html", {
        "posted": posted,
        "claimed": claimed,
    })
