# Backend Utils

Utilities compartilhadas entre apps do backend.

## Estrutura

```
utils/
├── __init__.py
├── validators.py      # Validadores Django (CPF, CNPJ, Processo CNJ)
├── formatters.py      # Formatadores para exibição
└── README.md          # Este arquivo
```

## Uso

### Validators

Para usar validators no model:

```python
from utils.validators import validate_cpf, validate_cnpj, validate_documento

class Contact(models.Model):
    document_number = models.CharField(
        max_length=18,
        validators=[validate_cpf]  # Adiciona validação
    )
```

Para validar programaticamente:

```python
from utils.validators import validate_cpf

try:
    validate_cpf('123.456.789-01')
    print("CPF válido")
except ValidationError as e:
    print(f"Erro: {e}")
```

### Formatters

Para formatar dados:

```python
from utils.formatters import format_cpf, format_cnpj, format_processo_cnj

# No model usando @property
@property
def document_formatted(self):
    from utils.formatters import format_document
    return format_document(self.document_number, self.person_type)
```

### Validators Disponíveis

- `validate_cpf(value)` - Valida CPF brasileiro (11 dígitos + dígitos verificadores)
- `validate_cnpj(value)` - Valida CNPJ brasileiro (14 dígitos + dígitos verificadores)
- `validate_document(value, person_type)` - Valida CPF ou CNPJ baseado no tipo
- `validate_processo_cnj(value)` - Valida número de processo judicial CNJ (20 dígitos)

### Formatters Disponíveis

- `format_cpf(cpf)` - Formata CPF: `'12345678901'` → `'123.456.789-01'`
- `format_cnpj(cnpj)` - Formata CNPJ: `'12345678000199'` → `'12.345.678/0001-99'`
- `format_document(doc, type)` - Formata CPF ou CNPJ baseado no tipo
- `format_processo_cnj(processo)` - Formata processo: `'00001234520248160000'` → `'0000123-45.2024.8.16.0000'`
- `format_phone(phone)` - Formata telefone: `'11999999999'` → `'(11) 99999-9999'`
- `format_cep(cep)` - Formata CEP: `'01310100'` → `'01310-100'`
- `clean_digits(value)` - Remove formatação, mantém apenas dígitos

## Filosofia

✅ **Backend**: Validação + Formatação para leitura
✅ **Database**: Dados limpos (apenas dígitos)
✅ **Frontend**: Máscaras de input visual

## Processo CNJ

Formato: `NNNNNNN-DD.AAAA.J.TR.OOOO`

Onde:

- `NNNNNNN` - Número sequencial (7 dígitos)
- `DD` - Dígitos verificadores (2 dígitos)
- `AAAA` - Ano (4 dígitos)
- `J` - Segmento judiciário (1 dígito)
- `TR` - Tribunal (2 dígitos)
- `OOOO` - Origem (4 dígitos)

Exemplo: `0000123-45.2024.8.16.0000`
