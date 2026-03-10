from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('cases', '0011_case_payment_terms_and_honorarios'),
    ]

    operations = [
        migrations.AlterField(
            model_name='case',
            name='participation_type',
            field=models.CharField(
                max_length=20,
                default='percentage',
                null=True,
                blank=True,
                choices=[
                    ('percentage', 'Percentual'),
                    ('fixed', 'Valor Fixo'),
                ],
                help_text='Tipo de participação: percentual ou valor fixo',
            ),
        ),
    ]
