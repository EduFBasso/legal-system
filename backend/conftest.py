"""
pytest configuration for Django project.
"""
import os
import django
from django.conf import settings

# Set Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# Setup Django
def pytest_configure(config):
    """Configure Django before running tests."""
    if not settings.configured:
        django.setup()
