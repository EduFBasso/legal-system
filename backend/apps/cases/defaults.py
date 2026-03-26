"""Domain defaults for the Cases app.

These lists provide a stable baseline UX even when the database is empty.

Important: Avoid using migrations as a runtime source of truth. Migrations are
historical DB artifacts; application defaults should live in application code.
"""

CASE_TIPO_ACAO_CHOICES: list[tuple[str, str]] = [
    ('CIVEL', 'Cível'),
    ('CRIMINAL', 'Criminal'),
    ('TRABALHISTA', 'Trabalhista'),
    ('TRIBUTARIA', 'Tributária'),
    ('FAMILIA', 'Família'),
    ('CONSUMIDOR', 'Consumidor'),
    ('OUTROS', 'Outros'),
]


CASE_PARTY_ROLE_CHOICES: list[tuple[str, str]] = [
    ('CLIENTE', 'Cliente/Representado'),
    ('AUTOR', 'Autor'),
    ('REU', 'Réu'),
    ('TESTEMUNHA', 'Testemunha'),
    ('PERITO', 'Perito'),
    ('TERCEIRO', 'Terceiro Interessado'),
]


# Default options used by the dynamic endpoint `/api/cases/party-role-options/`.
# Kept as a separate list from `CASE_PARTY_ROLE_CHOICES` so the UI can use
# more descriptive labels without changing the model's `get_role_display()`.
DEFAULT_CASE_PARTY_ROLE_OPTIONS: list[dict[str, str]] = [
    {'value': 'AUTOR', 'label': 'Autor/Requerente'},
    {'value': 'REU', 'label': 'Réu/Requerido'},
    {'value': 'TESTEMUNHA', 'label': 'Testemunha'},
    {'value': 'PERITO', 'label': 'Perito'},
    {'value': 'TERCEIRO', 'label': 'Terceiro Interessado'},
    {'value': 'CLIENTE', 'label': 'Cliente/Representado'},
]


# Default options used by `/api/cases/representation-type-options/`.
DEFAULT_CASE_REPRESENTATION_TYPES: list[str] = [
    'Procurador',
    'Representante Legal',
    'Tutor',
    'Curador',
    'Inventariante',
]


DEFAULT_CASE_TITULOS: list[str] = [
    # Exemplos citados
    'Embargos à Execução Fiscal',
    'Execução - Cumprimento de Sentença',
    'Execução Contratual',
    'Execução de Pena',
    'Cobrança de Aluguéis - Sem Despejo',

    # Cível / Obrigações / Contratos
    'Ação de Cobrança',
    'Ação Monitória',
    'Execução de Título Extrajudicial',
    'Cumprimento de Sentença',
    'Ação de Indenização por Danos Morais',
    'Ação de Indenização por Danos Materiais',
    'Ação de Obrigação de Fazer',
    'Ação de Obrigação de Não Fazer',
    'Ação de Rescisão Contratual',
    'Ação Declaratória',
    'Ação Revisional de Contrato',
    'Ação de Prestação de Contas',
    'Ação de Consignação em Pagamento',
    'Ação de Exibição de Documentos',
    'Tutela de Urgência (Antecipada)',

    # Consumidor
    'Ação de Indenização - Relação de Consumo',
    'Ação Revisional - Relação de Consumo',

    # Família / Sucessões
    'Ação de Alimentos',
    'Revisional de Alimentos',
    'Exoneração de Alimentos',
    'Guarda',
    'Regulamentação de Visitas',
    'Divórcio Consensual',
    'Divórcio Litigioso',
    'Reconhecimento e Dissolução de União Estável',
    'Inventário',
    'Arrolamento',

    # Imobiliário / Locação
    'Ação de Despejo',
    'Ação de Cobrança de Aluguéis',
    'Ação Renovatória de Locação',

    # Tributário
    'Execução Fiscal',
    'Embargos à Execução',
    'Mandado de Segurança',

    # Trabalhista
    'Reclamação Trabalhista',

    # Penal
    'Habeas Corpus',

    # Empresarial / Societário
    'Ação de Dissolução Parcial de Sociedade',
    'Ação de Apuração de Haveres',
]
