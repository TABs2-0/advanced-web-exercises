from django.urls import path
from . import views

app_name = "hustles"

urlpatterns = [
    path("",          views.map_view,          name="map"),
    path("list/",     views.my_tasks_view,      name="my_tasks"),
    path("post/",     views.post_task_view,     name="post_task"),
    path("leaderboard/", views.leaderboard_view, name="leaderboard"),
    path("<int:pk>/",          views.task_detail_view,  name="task_detail"),
    path("<int:pk>/claim/",    views.claim_task_view,   name="claim_task"),
    path("<int:pk>/complete/", views.complete_task_view,name="complete_task"),
    path("<int:pk>/rate/",     views.rate_task_view,    name="rate_task"),
    # JSON API for Leaflet map feed
    path("api/nearby/", views.nearby_tasks_api, name="api_nearby"),
]
