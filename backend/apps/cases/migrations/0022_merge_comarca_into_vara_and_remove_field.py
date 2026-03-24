import unicodedata

from django.db import migrations


def _normalize(value: str) -> str:
    raw = str(value or '').strip()
    if not raw:
        return ''
    nfd = unicodedata.normalize('NFD', raw)
    no_marks = ''.join(c for c in nfd if unicodedata.category(c) != 'Mn')
    collapsed = ' '.join(no_marks.split())
    return collapsed.lower()


def _collapse_spaces(value: str) -> str:
    return ' '.join(str(value or '').split()).strip()


def merge_comarca_into_vara(apps, schema_editor):
    Case = apps.get_model('cases', 'Case')

    qs = Case.objects.exclude(comarca='').exclude(comarca__isnull=True)
    for obj in qs.iterator():
        comarca = _collapse_spaces(obj.comarca)
        vara = _collapse_spaces(obj.vara)

        if not comarca:
            continue

        if not vara:
            obj.vara = comarca
            obj.save(update_fields=['vara'])
            continue

        normalized_vara = _normalize(vara)
        normalized_comarca = _normalize(comarca)

        # Se a vara já contém a comarca/foro, evita duplicar.
        if normalized_comarca and normalized_comarca in normalized_vara:
            continue

        obj.vara = f'{comarca} - {vara}'
        obj.save(update_fields=['vara'])


def noop_reverse(apps, schema_editor):
    # Irreversível semanticamente (não dá para separar comarca/vara de volta).
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('cases', '0021_seed_casetipoacaooption'),
    ]

    operations = [
        migrations.RunPython(merge_comarca_into_vara, reverse_code=noop_reverse),
        migrations.RemoveField(
            model_name='case',
            name='comarca',
        ),
    ]
