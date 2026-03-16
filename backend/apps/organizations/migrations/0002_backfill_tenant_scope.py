from django.db import migrations


def backfill_organizations(apps, schema_editor):
    Organization = apps.get_model('organizations', 'Organization')
    UserProfile = apps.get_model('accounts', 'UserProfile')
    Contact = apps.get_model('contacts', 'Contact')
    Case = apps.get_model('cases', 'Case')
    Notification = apps.get_model('notifications', 'Notification')

    default_org, _ = Organization.objects.get_or_create(name='Escritório Principal')

    UserProfile.objects.filter(organization__isnull=True).update(organization=default_org)

    profiles_by_user_id = dict(
        UserProfile.objects.exclude(organization__isnull=True).values_list('user_id', 'organization_id')
    )

    contacts_to_update = []
    for contact in Contact.objects.filter(organization__isnull=True).only('id', 'owner_id', 'organization_id'):
        contact.organization_id = profiles_by_user_id.get(contact.owner_id, default_org.id)
        contacts_to_update.append(contact)
    if contacts_to_update:
        Contact.objects.bulk_update(contacts_to_update, ['organization'])

    cases_to_update = []
    for case in Case.objects.filter(organization__isnull=True).only('id', 'owner_id', 'organization_id'):
        case.organization_id = profiles_by_user_id.get(case.owner_id, default_org.id)
        cases_to_update.append(case)
    if cases_to_update:
        Case.objects.bulk_update(cases_to_update, ['organization'])

    notifications_to_update = []
    for notification in Notification.objects.filter(organization__isnull=True).only('id', 'owner_id', 'organization_id'):
        notification.organization_id = profiles_by_user_id.get(notification.owner_id, default_org.id)
        notifications_to_update.append(notification)
    if notifications_to_update:
        Notification.objects.bulk_update(notifications_to_update, ['organization'])


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('organizations', '0001_initial'),
        ('accounts', '0002_userprofile_organization'),
        ('contacts', '0007_contact_organization'),
        ('cases', '0015_case_organization'),
        ('notifications', '0003_notification_organization'),
    ]

    operations = [
        migrations.RunPython(backfill_organizations, noop_reverse),
    ]
