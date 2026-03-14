"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from .api_views import get_system_settings, get_specific_setting

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.accounts.urls')),
    # System Settings: /api/system-settings
    path('api/system-settings/<str:setting_key>', get_specific_setting, name='get_setting'),
    path('api/system-settings', get_system_settings, name='system_settings'),
    # Contacts: /api/contacts/ (o router adiciona 'contacts' automaticamente)
    path('api/', include('apps.contacts.urls')),
    # Publications: /api/publications/today
    path('api/publications/', include('apps.publications.urls')),
    # Notifications: /api/notifications/
    path('api/notifications/', include('apps.notifications.urls')),
    # Cases: /api/cases/
    path('api/', include('apps.cases.urls')),
]

# Servir arquivos de mídia local em desenvolvimento
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
