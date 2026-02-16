"""
URLs para app publications.
"""
from django.urls import path
from . import views

app_name = 'publications'

urlpatterns = [
    path('today', views.fetch_today_publications, name='fetch_today'),
    path('search', views.search_publications, name='search'),
    path('debug', views.debug_search, name='debug'),
]
