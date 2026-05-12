"""
hustles.forms
-------------
Task posting and rating forms.
"""
from django import forms
from django.utils.translation import gettext_lazy as _

from .models import TaskCategoryChoices


INPUT_CLS = (
    "w-full bg-white border border-ink/20 rounded-[16px] "
    "px-4 py-3 text-ink text-base placeholder-slate focus:outline-none "
    "focus:border-ink focus:ring-1 focus:ring-ink transition-all duration-200"
)


class PostTaskForm(forms.Form):
    title = forms.CharField(
        label=_("What do you need done?"),
        max_length=80,
        widget=forms.TextInput(attrs={"placeholder": _("e.g. Help me move furniture"), "class": INPUT_CLS}),
    )
    description = forms.CharField(
        label=_("Give some details"),
        max_length=500,
        widget=forms.Textarea(attrs={
            "rows": 3,
            "placeholder": _("What exactly is the task? How long will it take?"),
            "class": INPUT_CLS,
        }),
    )
    category = forms.ChoiceField(
        label=_("Category"),
        choices=TaskCategoryChoices.choices,
        widget=forms.Select(attrs={"class": INPUT_CLS}),
    )
    pay = forms.DecimalField(
        label=_("Pay (XAF)"),
        min_value=0,
        max_digits=10,
        decimal_places=0,
        widget=forms.NumberInput(attrs={"placeholder": "2500", "class": INPUT_CLS}),
    )
    required_people = forms.IntegerField(
        label=_("People needed"),
        min_value=1,
        max_value=10,
        initial=1,
        widget=forms.NumberInput(attrs={"class": INPUT_CLS}),
    )
    neighborhood = forms.CharField(
        label=_("Neighborhood"),
        max_length=100,
        required=False,
        widget=forms.TextInput(attrs={"placeholder": _("e.g. Bastos, Molyko"), "class": INPUT_CLS}),
    )
    hours_until_expiry = forms.IntegerField(
        label=_("Task open for (hours)"),
        min_value=1,
        max_value=168,
        initial=24,
        widget=forms.NumberInput(attrs={"class": INPUT_CLS}),
    )
    is_flash_gig = forms.BooleanField(
        label=_("Flash-Gig (expires in 15 min, alerts nearby users)"),
        required=False,
        widget=forms.CheckboxInput(attrs={"class": "w-4 h-4 accent-signal"}),
    )

    # Hidden fields populated by Leaflet JS
    latitude = forms.FloatField(widget=forms.HiddenInput())
    longitude = forms.FloatField(widget=forms.HiddenInput())

    def clean(self):
        cleaned = super().clean()
        lat = cleaned.get("latitude")
        lng = cleaned.get("longitude")
        if lat is None or lng is None:
            raise forms.ValidationError(_("Please drop a pin on the map to set the task location."))
        return cleaned


class RatingForm(forms.Form):
    SCORE_CHOICES = [(i, f"{i} star{'s' if i > 1 else ''}") for i in range(1, 6)]

    score = forms.ChoiceField(
        label=_("Score"),
        choices=SCORE_CHOICES,
        widget=forms.RadioSelect(attrs={"class": "hidden"}),
    )
    comment = forms.CharField(
        label=_("Quick feedback (optional)"),
        max_length=280,
        required=False,
        widget=forms.Textarea(attrs={
            "rows": 2,
            "placeholder": _("Keep it real. 280 chars."),
            "class": INPUT_CLS,
        }),
    )

    def clean_score(self):
        return int(self.cleaned_data["score"])
