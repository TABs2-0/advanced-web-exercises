from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, render
from django.views.decorators.http import require_POST

from .models import Notification


@login_required
def notification_list_view(request):
    notifications = Notification.objects.filter(recipient=request.user)[:30]
    return render(request, "notifications/list.html", {"notifications": notifications})


@login_required
@require_POST
def mark_read_view(request, pk: int):
    n = get_object_or_404(Notification, pk=pk, recipient=request.user)
    n.is_read = True
    n.save(update_fields=["is_read"])
    return JsonResponse({"ok": True})
