from __future__ import annotations

import unicodedata

from django.db import migrations


def _normalize_key(value: str) -> str:
    raw = str(value or '').strip()
    if not raw:
        return ''
    nfd = unicodedata.normalize('NFD', raw)
    no_marks = ''.join(c for c in nfd if unicodedata.category(c) != 'Mn')
    collapsed = ' '.join(no_marks.split())
    return collapsed.lower()


def _deactivate_defaults_and_unused(apps, schema_editor):
    Case = apps.get_model('cases', 'Case')
    CaseParty = apps.get_model('cases', 'CaseParty')
    CaseRepresentation = apps.get_model('cases', 'CaseRepresentation')

    CaseTituloOption = apps.get_model('cases', 'CaseTituloOption')
    CaseTipoAcaoOption = apps.get_model('cases', 'CaseTipoAcaoOption')
    CasePartyRoleOption = apps.get_model('cases', 'CasePartyRoleOption')
    CaseRepresentationTypeOption = apps.get_model('cases', 'CaseRepresentationTypeOption')

    from apps.cases.defaults import (
        CASE_TIPO_ACAO_CHOICES,
        DEFAULT_CASE_PARTY_ROLE_OPTIONS,
        DEFAULT_CASE_REPRESENTATION_TYPES,
        DEFAULT_CASE_TITULOS,
    )

    default_titulo_keys = {_normalize_key(v) for v in (DEFAULT_CASE_TITULOS or []) if _normalize_key(v)}
    default_tipo_acao_label_keys = {
        _normalize_key(label) for _, label in (CASE_TIPO_ACAO_CHOICES or []) if _normalize_key(label)
    }
    default_party_role_label_keys = {
        _normalize_key(item.get('label'))
        for item in (DEFAULT_CASE_PARTY_ROLE_OPTIONS or [])
        if item and item.get('label') and _normalize_key(item.get('label'))
    }
    default_rep_type_keys = {
        _normalize_key(v) for v in (DEFAULT_CASE_REPRESENTATION_TYPES or []) if _normalize_key(v)
    }

    # 1) TÍTULO
    for opt in CaseTituloOption.objects.filter(is_active=True):
        key = str(getattr(opt, 'key', '') or '')
        if key in default_titulo_keys:
            # Defaults devem permanecer como lista fixa (não editável) via API.
            opt.is_active = False
            opt.save(update_fields=['is_active'])
            continue

        used = Case.objects.filter(titulo=opt.label).exists()
        if not used:
            opt.is_active = False
            opt.save(update_fields=['is_active'])

    # 2) TIPO DE AÇÃO
    for opt in CaseTipoAcaoOption.objects.filter(is_active=True):
        key = str(getattr(opt, 'key', '') or '')
        if key in default_tipo_acao_label_keys:
            # Duplicata de opção padrão (choices)
            opt.is_active = False
            opt.save(update_fields=['is_active'])
            continue

        used = Case.objects.filter(tipo_acao=opt.label).exists()
        if not used:
            opt.is_active = False
            opt.save(update_fields=['is_active'])

    # 3) PAPEL DA PARTE
    for opt in CasePartyRoleOption.objects.filter(is_active=True):
        key = str(getattr(opt, 'key', '') or '')
        if key in default_party_role_label_keys:
            # Defaults são lista fixa via API.
            opt.is_active = False
            opt.save(update_fields=['is_active'])
            continue

        used = CaseParty.objects.filter(role=opt.label).exists()
        if not used:
            opt.is_active = False
            opt.save(update_fields=['is_active'])

    # 4) TIPO DE REPRESENTAÇÃO
    for opt in CaseRepresentationTypeOption.objects.filter(is_active=True):
        key = str(getattr(opt, 'key', '') or '')
        if key in default_rep_type_keys:
            opt.is_active = False
            opt.save(update_fields=['is_active'])
            continue

        used = CaseRepresentation.objects.filter(representation_type=opt.label).exists()
        if not used:
            opt.is_active = False
            opt.save(update_fields=['is_active'])


class Migration(migrations.Migration):

    dependencies = [
        ('cases', '0024_caserepresentationtypeoption_caserepresentation_and_more'),
    ]

    operations = [
        migrations.RunPython(_deactivate_defaults_and_unused, reverse_code=migrations.RunPython.noop),
    ]
