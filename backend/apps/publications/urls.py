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
    path('history/delete', views.delete_search_history, name='delete_search_history'),
    path('history/<int:search_id>', views.get_search_history_detail, name='search_history_detail'),
    path('delete-multiple', views.delete_multiple_publications, name='delete_multiple'),
    path('delete-all', views.delete_all_publications, name='delete_all'),
    path('<int:id_api>/delete', views.delete_publication, name='delete'),
    path('<int:id_api>', views.get_publication_by_id, name='get_by_id'),
    path('debug', views.debug_search, name='debug'),
]
