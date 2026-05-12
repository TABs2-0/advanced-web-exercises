"""
hustles.services
----------------
All business logic for the hustles domain.
Views are thin; the heavy lifting happens here.
"""
from datetime import timedelta
from typing import Optional

from django.conf import settings
from django.contrib.gis.geos import Point
from django.contrib.gis.measure import Distance
from django.core.cache import cache
from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from .models import Task, Rating, TaskCategoryChoices


# ---------------------------------------------------------------------------
# Custom exceptions
# ---------------------------------------------------------------------------

class HustleError(Exception):
    """Generic hustle operation failure."""


class AlreadyClaimedError(HustleError):
    """Task was grabbed by someone else while you were looking."""


# ---------------------------------------------------------------------------
# Task creation
# ---------------------------------------------------------------------------

def create_task(
    poster,
    title: str,
    description: str,
    category: str,
    pay: float,
    latitude: float,
    longitude: float,
    required_people: int = 1,
    is_flash_gig: bool = False,
    neighborhood: str = "",
    hours_until_expiry: int = 24,
) -> Task:
    """
    Create and persist a new Task.
    Location fuzzing and expiry are handled by Task.save().
    """
    if is_flash_gig:
        expires_at = timezone.now() + timedelta(minutes=settings.FLASH_GIG_LIFETIME_MINUTES)
    else:
        expires_at = timezone.now() + timedelta(hours=hours_until_expiry)

    task = Task.objects.create(
        poster=poster,
        title=title,
        description=description,
        category=category,
        pay=pay,
        location=Point(longitude, latitude, srid=4326),
        required_people=required_people,
        is_flash_gig=is_flash_gig,
        neighborhood=neighborhood,
        expires_at=expires_at,
    )

    # Invalidate map cache for this area
    _bust_map_cache()
    return task


# ---------------------------------------------------------------------------
# Nearby tasks (the map feed)
# ---------------------------------------------------------------------------

def get_nearby_tasks(
    latitude: float,
    longitude: float,
    radius_m: Optional[int] = None,
    category: Optional[str] = None,
    limit: int = 50,
) -> list[dict]:
    """
    Return open, non-expired tasks within `radius_m` of the given point.
    Results are cached per (lat_rounded, lng_rounded, radius, category).
    Returns plain dicts (JSON-serialisable) for the Leaflet feed.
    """
    if radius_m is None:
        radius_m = settings.HUSTLE_PROXIMITY_RADIUS_M

    # Round coordinates to 2 dp (~1 km resolution) for cache key stability
    lat_r = round(latitude, 2)
    lng_r = round(longitude, 2)
    cache_key = f"nearby:{lat_r}:{lng_r}:{radius_m}:{category or 'all'}"

    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    user_point = Point(longitude, latitude, srid=4326)
    qs = Task.objects.filter(
        status=Task.StatusChoices.OPEN,
        expires_at__gt=timezone.now(),
    ).filter(
        Q(location_approx__distance_lte=(user_point, Distance(m=radius_m)))
        | Q(location_approx__isnull=True, location__distance_lte=(user_point, Distance(m=radius_m)))
    ).select_related("poster")

    if category:
        qs = qs.filter(category=category)

    tasks = []
    for t in qs[:limit]:
        public_location = t.location_approx or t.location
        tasks.append({
            "id": t.pk,
            "title": t.title,
            "category": t.category,
            "category_display": t.get_category_display(),
            "pay": str(t.pay),
            "pay_display": t.pay_display,
            "lat": public_location.y,
            "lng": public_location.x,
            "neighborhood": t.neighborhood,
            "is_flash_gig": t.is_flash_gig,
            "expires_at": t.expires_at.isoformat(),
            "poster": t.poster.username,
            "required_people": t.required_people,
        })

    cache.set(cache_key, tasks, timeout=settings.MAP_CACHE_TTL)
    return tasks


# ---------------------------------------------------------------------------
# Claiming
# ---------------------------------------------------------------------------

@transaction.atomic
def claim_task(task_id: int, claimer) -> Task:
    """
    Atomically lock a task for a claimer.
    Raises HustleError on any violation.
    """
    try:
        # Select for update to prevent race conditions
        task = Task.objects.select_for_update().get(pk=task_id)

        if task.poster == claimer:
            raise HustleError(_("You cannot claim your own task."))

        if task.status != Task.StatusChoices.OPEN:
            raise AlreadyClaimedError(_("Someone else got there first. Keep hunting."))

        if task.is_expired:
            raise HustleError(_("This task has already expired."))

        task.claimer = claimer
        task.status = Task.StatusChoices.CLAIMED
        task.save(update_fields=["claimer", "status", "updated_at"])

        # Create a notification for the poster
        from apps.notifications.models import Notification
        Notification.objects.create(
            recipient=task.poster,
            kind=Notification.KindChoices.TASK_CLAIMED,
            title=f"Your task '{task.title}' was claimed!",
            body=f"@{claimer.username} just locked your warrap.",
            url=f"/hustles/{task.pk}/",
        )

        _bust_map_cache()
        return task

    except Task.DoesNotExist:
        raise HustleError(_("This hustle no longer exists."))


# ---------------------------------------------------------------------------
# Completion & Rating
# ---------------------------------------------------------------------------

@transaction.atomic
def complete_task(task_id: int, requesting_user) -> Task:
    """Mark a claimed task as completed."""
    task = Task.objects.select_for_update().get(pk=task_id)

    if requesting_user not in (task.poster, task.claimer):
        raise HustleError(_("Only the poster or claimer can complete this task."))

    if task.status != Task.StatusChoices.CLAIMED:
        raise HustleError(_("Task is not in a claimable state for completion."))

    task.status = Task.StatusChoices.COMPLETED
    task.save(update_fields=["status", "updated_at"])

    # Increment claimer's completed count
    badge_awarded = False
    if task.claimer:
        from apps.accounts.models import User
        old_badge = task.claimer.badge
        User.objects.filter(pk=task.claimer.pk).update(
            total_completed=task.claimer.total_completed + 1
        )
        task.claimer.refresh_from_db()
        task.claimer.auto_assign_badge()
        if old_badge != task.claimer.badge:
            badge_awarded = True

    return task, badge_awarded


def submit_rating(task_id: int, rater, ratee, score: int, comment: str = "") -> Rating:
    """Submit a post-task rating and update ratee's Street Cred."""
    task = Task.objects.get(pk=task_id)

    if task.status != Task.StatusChoices.COMPLETED:
        raise HustleError(_("Can only rate after a task is completed."))

    if rater not in (task.poster, task.claimer):
        raise HustleError(_("You are not a party in this task."))

    if Rating.objects.filter(task=task, rater=rater, ratee=ratee).exists():
        raise HustleError(_("You have already rated this person for this task."))

    rating = Rating.objects.create(
        task=task, rater=rater, ratee=ratee, score=score, comment=comment
    )

    # Recalculate ratee's Street Cred
    ratee.recompute_street_cred()

    return rating


# ---------------------------------------------------------------------------
# Expiry management (called from management command / cron)
# ---------------------------------------------------------------------------

def expire_stale_tasks() -> int:
    """
    Mark all OPEN tasks past their expiry time as EXPIRED.
    Returns the number of tasks expired.
    Called by: python manage.py expire_tasks (see management/commands/)
    """
    expired_count = Task.objects.filter(
        status=Task.StatusChoices.OPEN,
        expires_at__lt=timezone.now(),
    ).update(status=Task.StatusChoices.EXPIRED)

    if expired_count:
        _bust_map_cache()

    return expired_count


# ---------------------------------------------------------------------------
# Leaderboard
# ---------------------------------------------------------------------------

def get_weekly_leaderboard(city: str = "", limit: int = 10) -> list:
    """
    Top hustlers by completed tasks in the current week.
    Cached for 5 minutes.
    """
    cache_key = f"leaderboard:weekly:{city or 'all'}"
    cached = cache.get(cache_key)
    if cached:
        return cached

    from apps.accounts.models import User
    from django.db.models import Count, Q

    week_start = timezone.now() - timedelta(days=7)
    qs = User.objects.annotate(
        week_completed=Count(
            "claimed_tasks",
            filter=Q(
                claimed_tasks__status=Task.StatusChoices.COMPLETED,
                claimed_tasks__updated_at__gte=week_start,
            ),
        )
    ).filter(week_completed__gt=0)

    if city:
        qs = qs.filter(city=city)

    result = list(qs.order_by("-week_completed")[:limit].values(
        "username", "first_name", "last_name", "badge", "street_cred",
        "week_completed", "avatar",
    ))
    cache.set(cache_key, result, timeout=300)
    return result


# ---------------------------------------------------------------------------
# Internals
# ---------------------------------------------------------------------------

def _bust_map_cache():
    """Invalidate all nearby-task cache keys. Simple wildcard delete."""
    # Django's built-in cache doesn't support pattern delete;
    # prefix-based delete works if using django-redis.
    try:
        from django_redis import get_redis_connection
        con = get_redis_connection("default")
        keys = con.keys("warrap:nearby:*")
        if keys:
            con.delete(*keys)
    except Exception:
        # Fall back gracefully if redis-specific API unavailable
        cache.clear()
