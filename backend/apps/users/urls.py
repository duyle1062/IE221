from django.urls import path
from .views import user_profile_view, change_password_view

app_name = 'users'

urlpatterns = [
    # User profile endpoints
    path("profile", user_profile_view, name='user_profile'),
    # Change password endpoint
    path("change-password", change_password_view, name='change_password'),
]
