"""
accounts.admin
--------------
Admin registration using django-unfold for a sleek dashboard.
"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _
from unfold.admin import ModelAdmin
from unfold.forms import AdminPasswordChangeForm, UserChangeForm, UserCreationForm

from .models import User, Vouch


@admin.register(User)
class UserAdmin(BaseUserAdmin, ModelAdmin):
    form = UserChangeForm
    add_form = UserCreationForm
    change_password_form = AdminPasswordChangeForm

    list_display = ["username", "display_name", "city", "street_cred", "total_completed", "badge", "is_active"]
    list_filter = ["city", "badge", "is_active", "is_staff"]
    search_fields = ["username", "email", "first_name", "last_name"]
    ordering = ["-date_joined"]

    fieldsets = (
        (None, {"fields": ("username", "password")}),
        (_("Personal info"), {"fields": ("first_name", "last_name", "email", "phone_number", "avatar", "bio")}),
        (_("Location & Preferences"), {"fields": ("city", "preferred_language")}),
        (_("Street Cred"), {"fields": ("street_cred", "total_completed", "badge", "vouch_count")}),
        (_("Permissions"), {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        (_("Important dates"), {"fields": ("last_login", "date_joined")}),
    )

    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("username", "email", "first_name", "last_name", "city", "password1", "password2"),
        }),
    )

    readonly_fields = ["street_cred", "total_completed", "vouch_count"]


@admin.register(Vouch)
class VouchAdmin(ModelAdmin):
    list_display = ["voucher", "vouchee", "task", "created_at"]
    list_filter = ["created_at"]
    search_fields = ["voucher__username", "vouchee__username"]
    readonly_fields = ["created_at"]
    raw_id_fields = ["voucher", "vouchee", "task"]
