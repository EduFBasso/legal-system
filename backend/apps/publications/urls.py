"""
URLs para app publications.
"""
from django.urls import path
from . import views

app_name = 'publications'

urlpatterns = [
    path('today', views.fetch_today_publications, name='fetch_today'),
    path('search', views.search_publications, name='search'),
    path('last-search', views.get_last_search, name='last_search'),
    path('retrieve-last-search', views.retrieve_last_search_publications, name='retrieve_last_search'),
    path('history', views.get_search_history, name='search_history'),
    path('history/<int:search_id>', views.get_search_history_detail, name='search_history_detail'),
    path('debug', views.debug_search, name='debug'),
]
