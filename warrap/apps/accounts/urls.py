from django.urls import path
from . import views

app_name = "accounts"

urlpatterns = [
    path("profile/edit/", views.edit_profile_view, name="edit_profile"),
    path("profile/<str:username>/", views.profile_view, name="profile"),
    path("vouch/<str:username>/", views.vouch_view, name="vouch"),
]
