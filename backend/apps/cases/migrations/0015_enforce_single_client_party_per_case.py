from django.db import migrations, models
from django.db.models import Q, Count


def deduplicate_client_parties(apps, schema_editor):
    CaseParty = apps.get_model('cases', 'CaseParty')

    duplicated_case_ids = (
        CaseParty.objects
        .filter(is_client=True)
        .values('case_id')
        .annotate(total=Count('id'))
        .filter(total__gt=1)
        .values_list('case_id', flat=True)
    )

    for case_id in duplicated_case_ids:
        parties = list(
            CaseParty.objects
            .filter(case_id=case_id, is_client=True)
            .order_by('-created_at', '-id')
        )

        # Mantém apenas o mais recente como cliente
        for party in parties[1:]:
            party.is_client = False
            party.save(update_fields=['is_client'])


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('cases', '0014_case_owner_alter_case_numero_processo_and_more'),
    ]

    operations = [
        migrations.RunPython(deduplicate_client_parties, noop_reverse),
        migrations.AddConstraint(
            model_name='caseparty',
            constraint=models.UniqueConstraint(
                fields=('case',),
                condition=Q(is_client=True),
                name='unique_client_party_per_case',
            ),
        ),
    ]
