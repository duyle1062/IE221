from django.urls import path
from .views import get_user_profile, get_current_user_info

app_name = 'users'

urlpatterns = [
    # User profile endpoints
    path("profile/", get_user_profile, name='get_user_profile'),
    path("current-user-info/", get_current_user_info, name='get_current_user_info'),
]
