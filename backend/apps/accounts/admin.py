from django.contrib import admin
from django.contrib.auth import get_user_model
from django.contrib.auth.admin import UserAdmin

from .models import UserProfile


class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    fk_name = 'user'
    extra = 0


class CustomUserAdmin(UserAdmin):
    inlines = [UserProfileInline]


User = get_user_model()

try:
    admin.site.unregister(User)
except admin.sites.NotRegistered:
    pass

admin.site.register(User, CustomUserAdmin)


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'role', 'oab_number', 'is_active', 'updated_at']
    list_filter = ['role', 'is_active']
    search_fields = ['user__username', 'user__email', 'full_name_oab', 'oab_number']
