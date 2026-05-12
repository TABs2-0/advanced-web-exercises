"""
hustles.models
--------------
Task (Hustle), Rating – the core domain models.
"""
from django.contrib.gis.db import models as gis_models
from django.contrib.gis.geos import Point
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from django.conf import settings
import random


# ---------------------------------------------------------------------------
# Choices – defined at module level so other apps can import them
# ---------------------------------------------------------------------------

class TaskCategoryChoices(models.TextChoices):
    DIGITAL  = "digital",  _("Digital")       # data entry, design, translation
    PHYSICAL = "physical", _("Physical")       # carrying, cleaning, construction
    DELIVERY = "delivery", _("Delivery")       # courier, errand
    EVENT    = "event",    _("Event")          # set-up, hosting, promo
    OTHER    = "other",    _("Other")


# ---------------------------------------------------------------------------
# Task
# ---------------------------------------------------------------------------

class Task(models.Model):
    """
    A Hustle. The heart of Warrap.
    One task = one opportunity = one map pin.
    """

    class StatusChoices(models.TextChoices):
        OPEN      = "open",      _("Open")
        CLAIMED   = "claimed",   _("Claimed")
        COMPLETED = "completed", _("Completed")
        EXPIRED   = "expired",   _("Expired")
        CANCELLED = "cancelled", _("Cancelled")

    # ── Parties ──────────────────────────────────────────────────────────────
    poster = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="posted_tasks",
        verbose_name=_("poster"),
    )
    claimer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="claimed_tasks",
        verbose_name=_("claimer"),
    )
    # For squad hustles: additional claimers
    squad_members = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        blank=True,
        related_name="squad_tasks",
        verbose_name=_("squad members"),
    )

    # ── Content ──────────────────────────────────────────────────────────────
    title = models.CharField(_("title"), max_length=80)
    description = models.TextField(_("description"), max_length=500)
    category = models.CharField(
        _("category"),
        max_length=20,
        choices=TaskCategoryChoices.choices,
        default=TaskCategoryChoices.OTHER,
    )
    pay = models.DecimalField(
        _("pay (XAF)"),
        max_digits=10,
        decimal_places=0,
        help_text=_("Amount in CFA Francs (XAF)."),
    )
    required_people = models.PositiveSmallIntegerField(
        _("required people"),
        default=1,
        help_text=_("Set > 1 to enable Squad Up mode."),
    )

    # ── Location ─────────────────────────────────────────────────────────────
    location = gis_models.PointField(
        _("exact location"),
        geography=True,
        srid=4326,
        help_text=_("Exact GPS point. Kept private until task is claimed."),
    )
    location_approx = gis_models.PointField(
        _("approximate location"),
        geography=True,
        srid=4326,
        help_text=_("Fuzzed location shown on the public map."),
        null=True, blank=True,
    )
    neighborhood = models.CharField(
        _("neighborhood"),
        max_length=100,
        blank=True,
        help_text=_("Human-readable area name (e.g. Bastos, Molyko)."),
    )

    # ── Flash-Gig ────────────────────────────────────────────────────────────
    is_flash_gig = models.BooleanField(
        _("flash-gig"),
        default=False,
        help_text=_("If true, task expires after 15 minutes and nearby users are notified immediately."),
    )

    # ── Status & timing ──────────────────────────────────────────────────────
    status = models.CharField(
        _("status"),
        max_length=15,
        choices=StatusChoices.choices,
        default=StatusChoices.OPEN,
        db_index=True,
    )
    expires_at = models.DateTimeField(
        _("expires at"),
        db_index=True,
    )
    created_at = models.DateTimeField(_("created at"), auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(_("updated at"), auto_now=True)

    class Meta:
        verbose_name = _("task")
        verbose_name_plural = _("tasks")
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status", "expires_at"]),
            models.Index(fields=["category", "status"]),
        ]

    def __str__(self):
        return f"[{self.get_status_display()}] {self.title}"

    # ── Computed helpers ─────────────────────────────────────────────────────
    @property
    def is_expired(self) -> bool:
        return timezone.now() > self.expires_at

    @property
    def is_open(self) -> bool:
        return self.status == self.StatusChoices.OPEN and not self.is_expired

    @property
    def pay_display(self) -> str:
        return f"{int(self.pay):,} XAF"

    @property
    def whatsapp_link(self) -> str:
        """
        WhatsApp deep-link with a branded pre-filled message.
        Phone is only available after task is claimed.
        """
        if not self.claimer or not self.claimer.phone_number:
            return "#"
        phone = self.claimer.phone_number.replace("+", "").replace(" ", "")
        message = (
            f"Hey! I found your task \"{self.title}\" on Warrap. "
            f"I am {self.poster.display_name} and I want to confirm the details. "
            f"Let us get this done!"
        )
        from urllib.parse import quote
        return f"https://wa.me/{phone}?text={quote(message)}"

    # ── Location helpers ─────────────────────────────────────────────────────
    def save(self, *args, **kwargs):
        """Auto-generate fuzzed location before first save."""
        if self.location and not self.location_approx:
            self.location_approx = self._fuzz_location(self.location)
        if self.is_flash_gig and not self.expires_at:
            from datetime import timedelta
            self.expires_at = timezone.now() + timedelta(
                minutes=settings.FLASH_GIG_LIFETIME_MINUTES
            )
        super().save(*args, **kwargs)

    @staticmethod
    def _fuzz_location(point: Point, radius_m: float = 300) -> Point:
        """
        Offset a GPS point by a random amount within `radius_m` metres.
        Uses a simple degree-based approximation valid for small offsets.
        """
        # ~111,320m per degree latitude; longitude degree shrinks with cos(lat)
        import math
        lat_offset = (random.uniform(-radius_m, radius_m)) / 111_320
        lng_offset = (random.uniform(-radius_m, radius_m)) / (111_320 * math.cos(math.radians(point.y)))
        return Point(point.x + lng_offset, point.y + lat_offset, srid=4326)


# ---------------------------------------------------------------------------
# Rating
# ---------------------------------------------------------------------------

class Rating(models.Model):
    """
    Post-task rating. Both poster and claimer rate each other.
    Feeds into User.street_cred.
    """
    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name="ratings",
        verbose_name=_("task"),
    )
    rater = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="ratings_given",
        verbose_name=_("rater"),
    )
    ratee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="ratings_received",
        verbose_name=_("ratee"),
    )
    score = models.PositiveSmallIntegerField(
        _("score"),
        choices=[(i, str(i)) for i in range(1, 6)],
        help_text=_("1 (worst) to 5 (best)."),
    )
    comment = models.TextField(_("comment"), max_length=280, blank=True)
    created_at = models.DateTimeField(_("created at"), auto_now_add=True)

    class Meta:
        verbose_name = _("rating")
        verbose_name_plural = _("ratings")
        unique_together = [("task", "rater", "ratee")]
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.rater} → {self.ratee}: {self.score}/5 on '{self.task}'"
