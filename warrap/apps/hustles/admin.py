from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from unfold.admin import ModelAdmin

from .models import Task, Rating, TaskApplication


@admin.register(Task)
class TaskAdmin(ModelAdmin):
    list_display = ["title", "poster", "claimer", "category", "pay_display", "status", "is_flash_gig", "expires_at", "created_at"]
    list_filter = ["status", "category", "is_flash_gig"]
    search_fields = ["title", "description", "poster__username", "claimer__username"]
    readonly_fields = ["created_at", "updated_at", "location_approx"]
    ordering = ["-created_at"]
    raw_id_fields = ["poster", "claimer"]

    fieldsets = (
        (_("Content"), {"fields": ("title", "description", "category", "pay", "required_people")}),
        (_("Location"), {"fields": ("location", "location_approx", "neighborhood")}),
        (_("Parties"), {"fields": ("poster", "claimer", "squad_members")}),
        (_("Status"), {"fields": ("status", "is_flash_gig", "expires_at")}),
        (_("Timestamps"), {"fields": ("created_at", "updated_at")}),
    )


@admin.register(Rating)
class RatingAdmin(ModelAdmin):
    list_display = ["task", "rater", "ratee", "score", "created_at"]
    list_filter = ["score"]
    search_fields = ["rater__username", "ratee__username", "task__title"]
    readonly_fields = ["created_at"]


@admin.register(TaskApplication)
class TaskApplicationAdmin(ModelAdmin):
    list_display = ["task", "applicant", "status", "created_at"]
    list_filter = ["status", "created_at"]
    search_fields = ["task__title", "applicant__username", "note"]
    readonly_fields = ["created_at", "updated_at"]
    raw_id_fields = ["task", "applicant"]
