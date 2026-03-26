import unicodedata

from django.conf import settings
from django.db import migrations


def _normalize_key(value: str) -> str:
    raw = str(value or '').strip()
    if not raw:
        return ''
    nfd = unicodedata.normalize('NFD', raw)
    no_marks = ''.join(c for c in nfd if unicodedata.category(c) != 'Mn')
    collapsed = ' '.join(no_marks.split())
    return collapsed.lower()


TIPO_ACAO_SEED = [
    'Cível',
    'Criminal',
    'Trabalhista',
    'Tributária',
    'Família',
    'Consumidor',
    'Outros',
]


def seed_tipo_acao(apps, schema_editor):
    CaseTipoAcaoOption = apps.get_model('cases', 'CaseTipoAcaoOption')

    # Em migrations, não dependa do user model real; deixa created_by nulo.
    for label in TIPO_ACAO_SEED:
        cleaned = ' '.join(str(label or '').split()).strip()
        if not cleaned:
            continue

        key = _normalize_key(cleaned)
        if not key:
            continue

        obj, created = CaseTipoAcaoOption.objects.get_or_create(
            key=key,
            defaults={
                'label': cleaned,
                'is_active': True,
                'created_by': None,
            },
        )
        if not created:
            if not obj.is_active:
                obj.is_active = True
                obj.save(update_fields=['is_active'])


def unseed_tipo_acao(apps, schema_editor):
    CaseTipoAcaoOption = apps.get_model('cases', 'CaseTipoAcaoOption')
    keys = [_normalize_key(' '.join(str(v or '').split()).strip()) for v in TIPO_ACAO_SEED]
    keys = [k for k in keys if k]
    if keys:
        CaseTipoAcaoOption.objects.filter(key__in=keys).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('cases', '0020_caselink_caselink_case_link_no_self_link_and_more'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.RunPython(seed_tipo_acao, reverse_code=unseed_tipo_acao),
    ]
