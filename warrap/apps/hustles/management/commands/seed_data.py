import random
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.hustles.models import TaskCategoryChoices, Task
from apps.hustles.services import create_task
from apps.accounts.models import CityChoices, BadgeChoices

User = get_user_model()

SEED_LOCATIONS = {
    "yaounde": [
        (3.8663, 11.5167, "Bastos"),
        (3.8480, 11.5021, "Melen"),
        (3.8741, 11.5268, "Mvog-Ada"),
        (3.8622, 11.4956, "Biyem-Assi"),
    ],
    "douala": [
        (4.0511, 9.7679, "Akwa"),
        (4.0435, 9.7028, "Bonamoussadi"),
        (4.0612, 9.7345, "Bali"),
    ],
    "buea": [
        (4.1527, 9.2403, "Molyko"),
        (4.1617, 9.2534, "Great Soppo"),
    ],
}

SEED_TASKS = [
    {
        "title": "Fix my laptop screen",
        "description": "It went blank yesterday. Lenovo ThinkPad.",
        "category": "digital",
        "pay": 15000,
        "is_flash_gig": False,
    },
    {
        "title": "Move a couch to 3rd floor",
        "description": "Need strong arms. Elevator is broken.",
        "category": "physical",
        "pay": 5000,
        "is_flash_gig": False,
    },
    {
        "title": "Deliver parcel to Mvan",
        "description": "Just documents. Very urgent, need it there now.",
        "category": "delivery",
        "pay": 2000,
        "is_flash_gig": True,
    },
    {
        "title": "Ushering for a wedding",
        "description": "Need 3 people to guide guests.",
        "category": "event",
        "pay": 10000,
        "is_flash_gig": False,
        "required_people": 3,
    },
    {
        "title": "Translate a 2-page document to French",
        "description": "Legal document, needs good accuracy.",
        "category": "digital",
        "pay": 8000,
        "is_flash_gig": False,
    },
    {
        "title": "Clean my apartment post-party",
        "description": "It's a mess. Need someone ASAP.",
        "category": "physical",
        "pay": 7000,
        "is_flash_gig": True,
    },
]

class Command(BaseCommand):
    help = "Seed the database with test users and tasks for the map feed."

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.NOTICE("Seeding data..."))
        
        users_data = [
            ("joel_cm", CityChoices.YAOUNDE, BadgeChoices.DIGITAL_NINJA),
            ("sarah_p", CityChoices.DOUALA, BadgeChoices.EVENT_PLUG),
            ("michel_x", CityChoices.BUEA, BadgeChoices.DELIVERY_REP),
            ("elise_t", CityChoices.YAOUNDE, BadgeChoices.ALL_ROUNDER),
            ("pablo_99", CityChoices.DOUALA, BadgeChoices.MUSCLE_CREW),
        ]
        
        users = []
        for username, city, badge in users_data:
            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    "city": city,
                    "badge": badge,
                    "email": f"{username}@example.com",
                    "street_cred": random.uniform(3.5, 5.0),
                    "total_completed": random.randint(5, 50),
                }
            )
            if created:
                user.set_password("warrap123")
                user.save()
            users.append(user)
            
        self.stdout.write(self.style.SUCCESS(f"Created/verified {len(users)} users."))

        # Generate 15 tasks using the permutations
        created_count = 0
        
        # Helper to randomly pick a location
        def get_random_location():
            city_key = random.choice(list(SEED_LOCATIONS.keys()))
            lat, lng, hood = random.choice(SEED_LOCATIONS[city_key])
            return lat, lng, hood

        for i in range(15):
            poster = random.choice(users)
            task_template = random.choice(SEED_TASKS)
            lat, lng, hood = get_random_location()
            
            title = f"{task_template['title']} (Seed {i+1})"
            
            if Task.objects.filter(title=title).exists():
                continue
            
            create_task(
                poster=poster,
                title=title,
                description=task_template["description"],
                category=task_template["category"],
                pay=task_template["pay"],
                latitude=lat,
                longitude=lng,
                required_people=task_template.get("required_people", 1),
                is_flash_gig=task_template["is_flash_gig"],
                neighborhood=hood,
            )
            created_count += 1
            
        self.stdout.write(self.style.SUCCESS(f"Successfully seeded {created_count} new tasks."))
