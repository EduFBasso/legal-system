from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('cases', '0010_add_caseprazo_model'),
    ]

    operations = [
        migrations.AddField(
            model_name='case',
            name='payment_terms',
            field=models.TextField(
                blank=True,
                default='',
                help_text='Condições de pagamento acordadas com o cliente',
            ),
        ),
        migrations.AddField(
            model_name='case',
            name='attorney_fee_amount',
            field=models.DecimalField(
                max_digits=15,
                decimal_places=2,
                null=True,
                blank=True,
                help_text='Valor dos honorarios por parcela (R$)',
            ),
        ),
        migrations.AddField(
            model_name='case',
            name='attorney_fee_installments',
            field=models.PositiveIntegerField(
                default=1,
                help_text='Quantidade de parcelas dos honorarios',
            ),
        ),
    ]
