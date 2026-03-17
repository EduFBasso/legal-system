from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='publication_auto_integration',
            field=models.BooleanField(default=False, help_text='Define se publicações devem ser integradas automaticamente para este usuário'),
        ),
    ]