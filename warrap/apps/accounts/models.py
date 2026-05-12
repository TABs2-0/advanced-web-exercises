"""
accounts.models
----------------
Custom User model and supporting profile data.

CRITICAL: AUTH_USER_MODEL is set to 'accounts.User' in settings.
This must be configured BEFORE any initial migrations.
"""
from django.contrib.auth.models import AbstractUser
from django.contrib.gis.db import models as gis_models
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.core.validators import RegexValidator


# ---------------------------------------------------------------------------
# Choices
# ---------------------------------------------------------------------------

class CityChoices(models.TextChoices):
    YAOUNDE  = "yaounde",  _("Yaoundé")
    DOUALA   = "douala",   _("Douala")
    BUEA     = "buea",     _("Buea")
    BAMENDA  = "bamenda",  _("Bamenda")
    BAFOUSSAM = "bafoussam", _("Bafoussam")
    GAROUA   = "garoua",   _("Garoua")
    MAROUA   = "maroua",   _("Maroua")
    NGAOUNDERE = "ngaoundere", _("Ngaoundéré")
    BERTOUA  = "bertoua",  _("Bertoua")
    EBOLOWA  = "ebolowa",  _("Ebolowa")
    OTHER    = "other",    _("Other")


class BadgeChoices(models.TextChoices):
    NONE          = "",              _("No badge yet")
    DIGITAL_NINJA = "digital_ninja", _("Digital Ninja")
    MUSCLE_CREW   = "muscle_crew",   _("Muscle Crew")
    EVENT_PLUG    = "event_plug",    _("Event Plug")
    DELIVERY_REP  = "delivery_rep",  _("Delivery Rep")
    ALL_ROUNDER   = "all_rounder",   _("All-Rounder")


# ---------------------------------------------------------------------------
# Custom User
# ---------------------------------------------------------------------------

class User(AbstractUser):
    """
    Extended user. We keep AbstractUser's username/email/password fields
    and add Warrap-specific profile data on the same model to avoid
    a OneToOne profile anti-pattern at this scale.
    """

    phone_regex = RegexValidator(
        regex=r"^\+?6[0-9]{8}$",
        message=_("Enter a valid Cameroonian phone number (e.g. +237612345678).")
    )

    # ── Contact ──────────────────────────────────────────────────────────────
    phone_number = models.CharField(
        _("phone number"),
        validators=[phone_regex],
        max_length=15,
        blank=True,
        help_text=_("Revealed to the other party only after a task is claimed.")
    )

    # ── Profile ──────────────────────────────────────────────────────────────
    bio = models.TextField(
        _("bio"),
        max_length=160,
        blank=True,
        help_text=_("Two lines max. Tell the streets who you are.")
    )
    avatar = models.ImageField(
        _("avatar"),
        upload_to="avatars/",
        blank=True,
        null=True,
    )
    city = models.CharField(
        _("city"),
        max_length=30,
        choices=CityChoices.choices,
        default=CityChoices.YAOUNDE,
    )

    # ── Gamification ─────────────────────────────────────────────────────────
    street_cred = models.FloatField(
        _("street cred"),
        default=0.0,
        help_text=_("Composite rating from 0.0 to 5.0, computed from completed task ratings.")
    )
    total_completed = models.PositiveIntegerField(
        _("total completed"),
        default=0,
        help_text=_("Total number of hustles completed as claimer.")
    )
    badge = models.CharField(
        _("badge"),
        max_length=20,
        choices=BadgeChoices.choices,
        default=BadgeChoices.NONE,
        blank=True,
    )
    vouch_count = models.PositiveIntegerField(
        _("vouch count"),
        default=0,
    )

    # ── Preferences ──────────────────────────────────────────────────────────
    preferred_language = models.CharField(
        _("language"),
        max_length=5,
        choices=[("en", "English"), ("fr", "Français")],
        default="en",
    )

    # ── Timestamps ───────────────────────────────────────────────────────────
    updated_at = models.DateTimeField(_("updated at"), auto_now=True)

    class Meta:
        verbose_name = _("user")
        verbose_name_plural = _("users")
        ordering = ["-date_joined"]

    def __str__(self):
        return f"@{self.username}"

    # ── Computed helpers ─────────────────────────────────────────────────────
    @property
    def display_name(self) -> str:
        """Full name if set, otherwise username."""
        return self.get_full_name() or self.username

    @property
    def avatar_url(self) -> str:
        """Safe avatar URL with fallback."""
        if self.avatar:
            return self.avatar.url
        return f"https://api.dicebear.com/7.x/thumbs/svg?seed={self.username}"

    @property
    def cred_display(self) -> str:
        """Formatted street cred for display."""
        return f"{self.street_cred:.1f}"

    def recompute_street_cred(self) -> None:
        """
        Recompute street_cred from all ratings received.
        Called after every new rating is saved.
        """
        from apps.hustles.models import Rating
        ratings = Rating.objects.filter(ratee=self)
        if ratings.exists():
            total = sum(r.score for r in ratings)
            self.street_cred = round(total / ratings.count(), 2)
        else:
            self.street_cred = 0.0
        self.save(update_fields=["street_cred"])

    def auto_assign_badge(self) -> None:
        """
        Auto-award category badge after 5 completions in the same category.
        Called after every task completion.
        """
        from apps.hustles.models import Task, TaskCategoryChoices
        BADGE_MAP = {
            TaskCategoryChoices.DIGITAL: BadgeChoices.DIGITAL_NINJA,
            TaskCategoryChoices.PHYSICAL: BadgeChoices.MUSCLE_CREW,
            TaskCategoryChoices.EVENT: BadgeChoices.EVENT_PLUG,
            TaskCategoryChoices.DELIVERY: BadgeChoices.DELIVERY_REP,
        }
        THRESHOLD = 5
        for category, badge in BADGE_MAP.items():
            count = Task.objects.filter(
                claimer=self,
                status=Task.StatusChoices.COMPLETED,
                category=category,
            ).count()
            if count >= THRESHOLD and self.badge != badge:
                self.badge = badge
                self.save(update_fields=["badge"])
                return

        # All-rounder: 5+ in any 3 different categories
        filled = sum(
            1 for cat in BADGE_MAP
            if Task.objects.filter(claimer=self, status=Task.StatusChoices.COMPLETED, category=cat).count() >= 3
        )
        if filled >= 3 and self.badge != BadgeChoices.ALL_ROUNDER:
            self.badge = BadgeChoices.ALL_ROUNDER
            self.save(update_fields=["badge"])


# ---------------------------------------------------------------------------
# Vouch
# ---------------------------------------------------------------------------

class Vouch(models.Model):
    """
    One-way trust endorsement between two users who completed a task together.
    Constraint: a user cannot vouch for the same person twice.
    """
    voucher = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="vouches_given",
        verbose_name=_("voucher"),
    )
    vouchee = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="vouches_received",
        verbose_name=_("vouchee"),
    )
    task = models.ForeignKey(
        "hustles.Task",
        on_delete=models.SET_NULL,
        null=True,
        related_name="vouches",
        verbose_name=_("task"),
        help_text=_("The completed task that enables this vouch.")
    )
    created_at = models.DateTimeField(_("created at"), auto_now_add=True)

    class Meta:
        verbose_name = _("vouch")
        verbose_name_plural = _("vouches")
        unique_together = [("voucher", "vouchee")]
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.voucher} vouches for {self.vouchee}"
