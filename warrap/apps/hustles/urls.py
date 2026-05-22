from django.urls import path
from . import views

app_name = "hustles"

urlpatterns = [
    path("",          views.map_view,          name="map"),
    path("list/",     views.my_tasks_view,      name="my_tasks"),
    path("post/",     views.post_task_view,     name="post_task"),
    path("leaderboard/", views.leaderboard_view, name="leaderboard"),
    path("admin-dashboard/", views.admin_dashboard_view, name="admin_dashboard"),
    path("<int:pk>/",          views.task_detail_view,  name="task_detail"),
    path("<int:pk>/apply/",    views.apply_task_view,   name="apply_task"),
    path("<int:pk>/complete/", views.complete_task_view,name="complete_task"),
    path("<int:pk>/rate/",     views.rate_task_view,    name="rate_task"),
    path("applications/<int:application_id>/accept/", views.accept_application_view, name="accept_application"),
    # JSON API for Leaflet map feed
    path("api/nearby/", views.nearby_tasks_api, name="api_nearby"),
]
