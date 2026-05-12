from django.conf import settings
from .models import PushSubscription, Notification
from apps.hustles.models import Task
import json
import logging

logger = logging.getLogger(__name__)

def notify_nearby_users_of_flash_gig(task: Task):
    if not task.is_flash_gig or not task.location_approx:
        return

    # In a full production implementation, use PostGIS to query users securely.
    # Currently users don't have location tracked globally in the same way.
    # For now, let's assume we notify any users who have a PushSubscription
    subs = PushSubscription.objects.select_related('user').all()
    
    if not subs.exists():
        return

    try:
        from pywebpush import webpush, WebPushException
    except ImportError:
        logger.warning("pywebpush is not installed; skipping Web Push.")
        return

    payload = json.dumps({
        "title": "New Flash-Gig Nearby!",
        "body": f"{task.pay_display} - {task.title}",
        "url": f"/hustles/{task.pk}/"
    })
    
    for sub in subs:
        # Also create a notification inside the app
        Notification.objects.create(
            recipient=sub.user,
            kind=Notification.KindChoices.FLASH_GIG,
            title="New Flash-Gig Nearby!",
            body=f"{task.pay_display} - {task.title}",
            url=f"/hustles/{task.pk}/"
        )
        
        if not settings.VAPID_PRIVATE_KEY:
            continue
            
        try:
            webpush(
                subscription_info={
                    "endpoint": sub.endpoint,
                    "keys": {
                        "p256dh": sub.p256dh,
                        "auth": sub.auth
                    }
                },
                data=payload,
                vapid_private_key=settings.VAPID_PRIVATE_KEY,
                vapid_claims={
                    "sub": f"mailto:{settings.VAPID_ADMIN_EMAIL}"
                }
            )
        except WebPushException as ex:
            logger.error(f"Web push failed: {ex}")
            if ex.response and ex.response.status_code in [404, 410]:
                sub.delete()
