from django.urls import path

from .views import LoginView, RefreshTokenView, lawyers_for_login, me


urlpatterns = [
    path('login/', LoginView.as_view(), name='auth_login'),
    path('refresh/', RefreshTokenView.as_view(), name='auth_refresh'),
    path('me/', me, name='auth_me'),
    path('lawyers/', lawyers_for_login, name='auth_lawyers'),
]
