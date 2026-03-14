from django.urls import path

from .views import LoginView, RefreshTokenView, me


urlpatterns = [
    path('login/', LoginView.as_view(), name='auth_login'),
    path('refresh/', RefreshTokenView.as_view(), name='auth_refresh'),
    path('me/', me, name='auth_me'),
]
