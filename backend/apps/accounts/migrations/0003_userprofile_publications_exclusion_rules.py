from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0002_userprofile_publication_auto_integration'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='publications_excluded_oabs',
            field=models.JSONField(blank=True, default=list, help_text='Lista de números de OAB (sem formatação) para rejeitar publicações (evita falsos positivos)'),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='publications_excluded_keywords',
            field=models.JSONField(blank=True, default=list, help_text='Lista de frases/trechos para rejeitar publicações (evita falsos positivos)'),
        ),
    ]
