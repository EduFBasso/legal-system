from django.urls import path

from .views import (
    LoginView,
    RefreshTokenView,
    lawyers_for_login,
    master_self_account,
    me,
    user_preferences,
    team_member_deactivate,
    team_member_reactivate,
    team_member_update,
    team_members,
)


urlpatterns = [
    path('login/', LoginView.as_view(), name='auth_login'),
    path('refresh/', RefreshTokenView.as_view(), name='auth_refresh'),
    path('me/', me, name='auth_me'),
    path('preferences/', user_preferences, name='auth_preferences'),
    path('account/', master_self_account, name='auth_master_self_account'),
    path('lawyers/', lawyers_for_login, name='auth_lawyers'),
    path('team/', team_members, name='auth_team_members'),
    path('team/<int:user_id>/', team_member_update, name='auth_team_member_update'),
    path('team/<int:user_id>/deactivate/', team_member_deactivate, name='auth_team_member_deactivate'),
    path('team/<int:user_id>/reactivate/', team_member_reactivate, name='auth_team_member_reactivate'),
]
