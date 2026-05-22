"""
accounts.services
-----------------
All business logic for the accounts domain.
Views call these functions; models don't talk to views.
This separation makes logic easy to test and reuse.
"""
import json

from django.utils.translation import gettext_lazy as _

from .models import User, Vouch


class VouchError(Exception):
    """Raised when a vouch cannot be created."""


def can_user_vouch(voucher: User, vouchee: User) -> bool:
    """
    A user can vouch only if they share at least one completed task
    together (either as poster/claimer or claimer/poster).
    """
    from apps.hustles.models import Task

    shared = Task.objects.filter(
        status=Task.StatusChoices.COMPLETED,
    ).filter(
        # voucher was the poster and vouchee was the claimer, or vice-versa
        poster=voucher, claimer=vouchee,
    ) | Task.objects.filter(
        status=Task.StatusChoices.COMPLETED,
        poster=vouchee, claimer=voucher,
    )
    return shared.exists()


def create_vouch(voucher: User, vouchee: User) -> Vouch:
    """
    Create a vouch between two users.
    Raises VouchError on any constraint violation.
    """
    if voucher == vouchee:
        raise VouchError(_("You cannot vouch for yourself."))

    if Vouch.objects.filter(voucher=voucher, vouchee=vouchee).exists():
        raise VouchError(_("You have already vouched for this person."))

    if not can_user_vouch(voucher, vouchee):
        raise VouchError(
            _("You can only vouch for someone after completing a task together.")
        )

    # Find the shared completed task to attach to the vouch
    from apps.hustles.models import Task
    shared_task = Task.objects.filter(
        status=Task.StatusChoices.COMPLETED,
    ).filter(
        poster=voucher, claimer=vouchee,
    ).first() or Task.objects.filter(
        status=Task.StatusChoices.COMPLETED,
        poster=vouchee, claimer=voucher,
    ).first()

    vouch = Vouch.objects.create(
        voucher=voucher,
        vouchee=vouchee,
        task=shared_task,
    )

    # Increment the vouchee's count
    User.objects.filter(pk=vouchee.pk).update(vouch_count=vouchee.vouch_count + 1)

    return vouch


def get_user_completed_tasks(user: User, limit: int = 6):
    """Return the most recent completed tasks for a user's profile page."""
    from apps.hustles.models import Task
    return (
        Task.objects.filter(claimer=user, status=Task.StatusChoices.COMPLETED)
        .select_related("poster")
        .order_by("-updated_at")[:limit]
    )


def get_user_activity_analytics(user: User) -> dict:
    """Return profile analytics derived from available activity."""
    from apps.hustles.models import Task, TaskApplication

    completed = Task.objects.filter(claimer=user, status=Task.StatusChoices.COMPLETED)
    posted = Task.objects.filter(poster=user)
    applications = TaskApplication.objects.filter(applicant=user)

    category_counts = {}
    for task in completed:
        label = task.get_category_display()
        category_counts[label] = category_counts.get(label, 0) + 1

    stats = {
        "posted": posted.count(),
        "applied": applications.count(),
        "selected": applications.filter(status=TaskApplication.StatusChoices.ACCEPTED).count(),
        "completed": completed.count(),
    }
    total_activity = sum(stats.values())
    selection_rate = round((stats["selected"] / stats["applied"]) * 100) if stats["applied"] else 0

    if stats["completed"] >= 3:
        brief = _("You are building a visible work record. Completed gigs are the strongest trust signal on Warrap.")
    elif stats["applied"]:
        brief = _("You have started applying. As posters choose you and both sides confirm completion, your Street Cred gets stronger.")
    elif stats["posted"]:
        brief = _("You are creating opportunities. Applicant activity on your gigs will appear here as it grows.")
    else:
        brief = _("Start by posting or applying for a hustle. Your activity insights will grow from there.")

    category_labels = [str(label) for label in category_counts.keys()] or [str(_("No completed gigs yet"))]
    category_values = list(category_counts.values()) or [1]

    return {
        "has_activity": total_activity > 0,
        "stats": stats,
        "selection_rate": selection_rate,
        "category_labels_json": json.dumps(category_labels),
        "category_values_json": json.dumps(category_values),
        "brief": brief,
    }
