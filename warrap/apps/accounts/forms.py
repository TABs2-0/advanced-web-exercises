"""
accounts.forms
--------------
Custom allauth forms + profile editing.
We extend allauth's SignupForm / LoginForm rather than replacing them,
so all of allauth's validation, email verification, and social-auth
plumbing still works underneath.
"""
from django import forms
from django.utils.translation import gettext_lazy as _
from allauth.account.forms import SignupForm, LoginForm

from .models import User, CityChoices


INPUT_CLS = (
    "w-full bg-white border border-ink/20 rounded-[16px] "
    "px-4 py-3 text-ink text-base placeholder:text-slate "
    "focus:outline-none focus:border-ink focus:ring-1 focus:ring-ink "
    "transition-all duration-200"
)

SELECT_CLS = (
    "w-full bg-white border border-ink/20 rounded-[16px] "
    "px-4 py-3 text-ink text-base "
    "focus:outline-none focus:border-ink focus:ring-1 focus:ring-ink "
    "transition-all duration-200"
)


def _apply_tailwind(form_instance):
    for field in form_instance.fields.values():
        cls = SELECT_CLS if isinstance(field.widget, forms.Select) else INPUT_CLS
        existing = field.widget.attrs.get("class", "")
        field.widget.attrs["class"] = f"{cls} {existing}".strip()


class WarrapSignupForm(SignupForm):
    first_name = forms.CharField(
        label=_("First name"), max_length=50,
        widget=forms.TextInput(attrs={"placeholder": _("e.g. Aïcha"), "autocomplete": "given-name"}),
    )
    last_name = forms.CharField(
        label=_("Last name"), max_length=50,
        widget=forms.TextInput(attrs={"placeholder": _("e.g. Njoya"), "autocomplete": "family-name"}),
    )
    phone_number = forms.CharField(
        label=_("Phone (WhatsApp)"), max_length=15, required=False,
        widget=forms.TextInput(attrs={"placeholder": "+237612345678"}),
        help_text=_("Only shared after you lock a gig."),
    )
    city = forms.ChoiceField(
        label=_("City"), choices=CityChoices.choices, widget=forms.Select(),
    )
    field_order = ["first_name", "last_name", "username", "email", "phone_number", "city", "password1", "password2"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        _apply_tailwind(self)
        self.fields["username"].widget.attrs["placeholder"] = _("Pick a street name")
        self.fields["email"].widget.attrs["placeholder"] = "you@example.com"

    def save(self, request):
        user = super().save(request)
        user.first_name = self.cleaned_data.get("first_name", "")
        user.last_name = self.cleaned_data.get("last_name", "")
        user.phone_number = self.cleaned_data.get("phone_number", "")
        user.city = self.cleaned_data.get("city", CityChoices.YAOUNDE)
        user.save(update_fields=["first_name", "last_name", "phone_number", "city"])
        return user


class WarrapLoginForm(LoginForm):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        _apply_tailwind(self)
        self.fields["login"].widget.attrs["placeholder"] = _("Username or email")
        self.fields["password"].widget.attrs["placeholder"] = "••••••••"
        if "remember" in self.fields:
            self.fields["remember"].widget.attrs["class"] = "w-4 h-4 accent-ink"


class EditProfileForm(forms.ModelForm):
    class Meta:
        model = User
        fields = ["first_name", "last_name", "phone_number", "bio", "avatar", "city", "preferred_language"]
        widgets = {"bio": forms.Textarea(attrs={"rows": 3, "placeholder": _("Two lines. Keep it real.")})}

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        _apply_tailwind(self)
