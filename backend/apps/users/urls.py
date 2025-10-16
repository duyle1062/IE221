from django.urls import path
from .views import user_profile_view

app_name = 'users'

urlpatterns = [
    # User profile endpoints
    path("profile", user_profile_view, name='user_profile'),
]
