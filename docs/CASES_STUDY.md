# Cases (Processos) - Estudo e Planejamento Completo

**Data**: 21/02/2026  
**Status**: 📋 Planejamento  
**Objetivo**: Criar o módulo central do sistema que unifica todos os outros

---

## 1. Visão Geral

### 1.1 Por que Cases é o Core do Sistema?

O **número do processo** é o **identificador único** que conecta tudo:

```
                    ┌─────────────┐
                    │   CASE      │
                    │ (Processo)  │
                    └──────┬──────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
    ┌──────────┐    ┌──────────┐    ┌──────────┐
    │ Contacts │    │Publications│   │  Agenda  │
    │(Clientes)│    │(Intimações)│   │ (Prazos) │
    └──────────┘    └──────────┘    └──────────┘
          │                │                │
          └────────────────┼────────────────┘
                           │
                    Timeline de Eventos
```

### 1.2 Situação Atual

**✅ Já Implementado:**

- Publications com campo `numero_processo` (indexado)
- Contacts (clientes independentes)
- Soft delete em publications

**🔜 Próximo Passo:**

- **Cases**: Criar o app que unifica tudo

---

## 2. Análise de Requisitos

### 2.1 Requisitos Explícitos (Advogada)

1. **Cadastro de processos** com número CNJ
2. **Vinculação com clientes** (partes envolvidas)
3. **Histórico de publicações** por processo
4. **Status do processo** (mesmo que ela não queira desativar manualmente)

### 2.2 Requisitos Implícitos (Descobertos)

1. **Auto-vinculação**: Publicações com `numero_processo` devem vincular automaticamente ao Case
2. **Timeline cronológica**: Histórico de eventos do processo organizado
3. **Filtros contextuais**: Ver publicações, prazos, documentos de um processo específico
4. **Dashboard por processo**: Visão consolidada do andamento

### 2.3 Valor Agregado (Além do Pedido)

1. **Status inteligente**:
   - Ativo: Tem publicação recente (< 90 dias)
   - Inativo: Sem movimentação (90+ dias)
   - Arquivado: Encerrado (decisão final)
   - Suspenso: Aguardando
2. **Alertas por gravidade**:
   - 🔴 Urgente: Prazo fatal (< 3 dias)
   - 🟡 Atenção: Prazo próximo (< 7 dias)
   - 🟢 Normal: Sem prazo iminente
3. **Analytics por processo**:
   - Número de publicações recebidas
   - Tempo médio entre intimações
   - Prazos cumpridos vs perdidos
   - Última movimentação
4. **Busca inteligente**:
   - Por número CNJ (com ou sem formatação)
   - Por nome do cliente
   - Por tribunal
   - Por status
   - Por período (processos com movimentação em X dias)

5. **Organização automática**:
   - Publicações ordenadas por data
   - Destaque para palavras-chave (prazo, julgamento, sentença)
   - Identificação de tipos (despacho, decisão, intimação)

---

## 3. Modelo de Dados

### 3.1 Case Model (Proposta)

```python
from django.db import models
from django.utils import timezone
from django.core.validators import RegexValidator


class Case(models.Model):
    """
    Processo judicial - núcleo central do sistema.
    """

    # ========== IDENTIFICAÇÃO ==========
    numero_processo = models.CharField(
        max_length=25,
        unique=True,
        db_index=True,
        validators=[
            RegexValidator(
                regex=r'^\d{7}-\d{2}\.\d{4}\.\d{1}\.\d{2}\.\d{4}$',
                message='Formato CNJ inválido. Use: 0000000-00.0000.0.00.0000'
            )
        ],
        help_text='Número CNJ do processo (formato: 1234567-89.2021.8.26.0100)'
    )

    numero_processo_unformatted = models.CharField(
        max_length=20,
        db_index=True,
        help_text='Número limpo (apenas dígitos) para busca'
    )

    # ========== DADOS BÁSICOS ==========
    titulo = models.CharField(
        max_length=200,
        blank=True,
        help_text='Título/Descrição resumida (ex: Ação de Cobrança - João Silva)'
    )

    tribunal = models.CharField(
        max_length=10,
        db_index=True,
        help_text='Ex: TJSP, TRF3, TST'
    )

    comarca = models.CharField(
        max_length=100,
        blank=True,
        help_text='Comarca/Subseção judiciária'
    )

    vara = models.CharField(
        max_length=200,
        blank=True,
        help_text='Vara/Turma/Câmara'
    )

    tipo_acao = models.CharField(
        max_length=100,
        blank=True,
        choices=[
            ('CIVEL', 'Cível'),
            ('CRIMINAL', 'Criminal'),
            ('TRABALHISTA', 'Trabalhista'),
            ('TRIBUTARIA', 'Tributária'),
            ('FAMILIA', 'Família'),
            ('CONSUMIDOR', 'Consumidor'),
            ('OUTROS', 'Outros'),
        ],
        help_text='Área do direito'
    )

    # ========== RELACIONAMENTOS ==========
    # ManyToMany com Contacts (partes no processo)
    clients = models.ManyToManyField(
        'contacts.Contact',
        through='CaseParty',
        related_name='cases',
        help_text='Clientes/partes envolvidas no processo'
    )

    # ========== STATUS ==========
    status = models.CharField(
        max_length=20,
        default='ATIVO',
        db_index=True,
        choices=[
            ('ATIVO', 'Ativo'),
            ('INATIVO', 'Inativo'),
            ('SUSPENSO', 'Suspenso'),
            ('ARQUIVADO', 'Arquivado'),
            ('ENCERRADO', 'Encerrado'),
        ],
        help_text='Status atual do processo'
    )

    auto_status = models.BooleanField(
        default=True,
        help_text='Se True, status é calculado automaticamente baseado em atividade'
    )

    # ========== DATAS IMPORTANTES ==========
    data_distribuicao = models.DateField(
        null=True,
        blank=True,
        help_text='Data de distribuição/protocolo'
    )

    data_ultima_movimentacao = models.DateField(
        null=True,
        blank=True,
        db_index=True,
        help_text='Data da última publicação/movimentação (auto-atualizado)'
    )

    data_encerramento = models.DateField(
        null=True,
        blank=True,
        help_text='Data de encerramento/arquivamento'
    )

    # ========== VALOR E PARTES ==========
    valor_causa = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        null=True,
        blank=True,
        help_text='Valor da causa em R$'
    )

    parte_contraria = models.CharField(
        max_length=200,
        blank=True,
        help_text='Nome da parte contrária (ré/autor/reclamada)'
    )

    # ========== OBSERVAÇÕES ==========
    observacoes = models.TextField(
        blank=True,
        help_text='Observações internas sobre o caso'
    )

    tags = models.JSONField(
        default=list,
        blank=True,
        help_text='Tags para categorização (ex: ["urgente", "aposentadoria"])'
    )

    # ========== SOFT DELETE ==========
    deleted = models.BooleanField(
        default=False,
        db_index=True,
        help_text='Soft delete para auditoria'
    )

    deleted_at = models.DateTimeField(
        null=True,
        blank=True
    )

    deleted_reason = models.CharField(
        max_length=255,
        blank=True
    )

    # ========== TIMESTAMPS ==========
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # ========== META ==========
    class Meta:
        ordering = ['-data_ultima_movimentacao', '-created_at']
        verbose_name = 'Processo'
        verbose_name_plural = 'Processos'
        indexes = [
            models.Index(fields=['tribunal', 'status']),
            models.Index(fields=['-data_ultima_movimentacao']),
            models.Index(fields=['numero_processo_unformatted']),
            models.Index(fields=['deleted', '-data_ultima_movimentacao']),
        ]

    # ========== PROPERTIES ==========
    @property
    def numero_processo_formatted(self):
        """Retorna número formatado CNJ."""
        num = self.numero_processo_unformatted
        if len(num) == 20:
            return f"{num[0:7]}-{num[7:9]}.{num[9:13]}.{num[13]}.{num[14:16]}.{num[16:20]}"
        return self.numero_processo

    @property
    def dias_sem_movimentacao(self):
        """Dias desde última movimentação."""
        if not self.data_ultima_movimentacao:
            return None
        delta = timezone.now().date() - self.data_ultima_movimentacao
        return delta.days

    @property
    def esta_ativo(self):
        """Considera ativo se teve movimentação nos últimos 90 dias."""
        if not self.data_ultima_movimentacao:
            return False
        return self.dias_sem_movimentacao <= 90

    @property
    def total_publicacoes(self):
        """Número total de publicações vinculadas."""
        return self.publications.filter(deleted=False).count()

    @property
    def publicacoes_recentes(self):
        """Publicações dos últimos 30 dias."""
        from datetime import timedelta
        data_limite = timezone.now().date() - timedelta(days=30)
        return self.publications.filter(
            deleted=False,
            data_disponibilizacao__gte=data_limite
        ).count()

    @property
    def nivel_urgencia(self):
        """
        Calcula nível de urgência baseado em prazos e publicações.
        Retorna: 'URGENTE', 'ATENCAO', 'NORMAL'
        """
        # TODO: Implementar quando Agenda estiver pronto
        # Verificar se há prazos fatais < 3 dias
        return 'NORMAL'

    # ========== METHODS ==========
    def atualizar_status_automatico(self):
        """
        Atualiza status baseado em atividade recente.
        Só atualiza se auto_status=True.
        """
        if not self.auto_status:
            return

        dias = self.dias_sem_movimentacao

        if dias is None:
            self.status = 'INATIVO'
        elif dias <= 90:
            self.status = 'ATIVO'
        elif dias <= 180:
            self.status = 'INATIVO'
        else:
            self.status = 'ARQUIVADO'

        self.save(update_fields=['status'])

    def vincular_publicacoes_pendentes(self):
        """
        Busca publicações com mesmo numero_processo que ainda não estão vinculadas.
        """
        from apps.publications.models import Publication

        pubs_pendentes = Publication.objects.filter(
            numero_processo=self.numero_processo,
            deleted=False
        ).filter(
            models.Q(case__isnull=True) | ~models.Q(case=self)
        )

        count = pubs_pendentes.update(case=self)

        # Atualizar data_ultima_movimentacao
        ultima_pub = self.publications.filter(
            deleted=False
        ).order_by('-data_disponibilizacao').first()

        if ultima_pub:
            self.data_ultima_movimentacao = ultima_pub.data_disponibilizacao
            self.save(update_fields=['data_ultima_movimentacao'])

        return count

    def __str__(self):
        if self.titulo:
            return f"{self.numero_processo} - {self.titulo}"
        return self.numero_processo

    def save(self, *args, **kwargs):
        # Auto-preencher numero_processo_unformatted
        if self.numero_processo:
            self.numero_processo_unformatted = ''.join(filter(str.isdigit, self.numero_processo))
        super().save(*args, **kwargs)


class CaseParty(models.Model):
    """
    Tabela intermediária para relacionamento ManyToMany entre Case e Contact.
    Permite especificar o papel de cada parte.
    """

    case = models.ForeignKey(
        'Case',
        on_delete=models.CASCADE,
        related_name='parties'
    )

    contact = models.ForeignKey(
        'contacts.Contact',
        on_delete=models.CASCADE,
        related_name='case_roles'
    )

    role = models.CharField(
        max_length=20,
        choices=[
            ('CLIENTE', 'Cliente/Representado'),
            ('AUTOR', 'Autor'),
            ('REU', 'Réu'),
            ('TESTEMUNHA', 'Testemunha'),
            ('PERITO', 'Perito'),
            ('TERCEIRO', 'Terceiro Interessado'),
        ],
        default='CLIENTE',
        help_text='Papel da parte no processo'
    )

    observacoes = models.TextField(
        blank=True,
        help_text='Observações sobre a participação dessa parte'
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('case', 'contact')
        verbose_name = 'Parte do Processo'
        verbose_name_plural = 'Partes do Processo'

    def __str__(self):
        return f"{self.contact.name} - {self.get_role_display()} ({self.case.numero_processo})"
```

### 3.2 Relacionamento com Publication

**Alteração necessária em `Publication` model:**

```python
# Adicionar ForeignKey
case = models.ForeignKey(
    'cases.Case',
    on_delete=models.SET_NULL,
    null=True,
    blank=True,
    related_name='publications',
    help_text='Processo vinculado'
)
```

---

## 4. API Endpoints

### 4.1 CRUD Básico

```
GET    /api/cases/                     - Listar processos (filtros: status, tribunal, cliente)
POST   /api/cases/                     - Criar processo
GET    /api/cases/{id}/                - Detalhes do processo
PUT    /api/cases/{id}/                - Atualizar processo
DELETE /api/cases/{id}/                - Soft delete do processo
```

### 4.2 Endpoints Especiais

```
GET    /api/cases/{id}/timeline/       - Timeline de eventos (publicações ordenadas)
GET    /api/cases/{id}/publications/   - Publicações vinculadas
POST   /api/cases/{id}/link-contact/   - Vincular contato como parte
DELETE /api/cases/{id}/unlink-contact/ - Desvincular contato
POST   /api/cases/{id}/update-status/  - Forçar atualização de status
GET    /api/cases/search/?q=           - Busca por número/cliente/tribunal
GET    /api/cases/stats/               - Estatísticas gerais (total, ativos, inativos)
POST   /api/cases/auto-link/           - Vincular publicações órfãs aos processos
```

---

## 5. Frontend Design

### 5.1 Lista de Processos (CasesPage)

**Layout:**

```
┌────────────────────────────────────────────────────────┐
│ 🔍 Buscar processo...           [+] Novo Processo     │
├────────────────────────────────────────────────────────┤
│ Filtros: [Todos ▼] [TJSP ▼] [Cliente ▼]              │
├────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────┐  │
│ │ 🟢 0001234-56.2024.8.26.0100                     │  │
│ │ Ação de Cobrança - João Silva                    │  │
│ │ TJSP • 2ª Vara Cível • 3 publicações • há 2 dias │  │
│ └──────────────────────────────────────────────────┘  │
│ ┌──────────────────────────────────────────────────┐  │
│ │ 🟡 0007890-12.2023.8.26.0200                     │  │
│ │ Reclamação Trabalhista - Maria Santos            │  │
│ │ TRT2 • 15ª Vara do Trabalho • 12 pubs • há 7d   │  │
│ └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

**Badges de status:**

- 🟢 Verde: Ativo (movimentação < 90 dias)
- 🟡 Amarelo: Inativo (90-180 dias)
- 🔴 Vermelho: Urgente (prazo fatal)
- ⚪ Cinza: Arquivado

### 5.2 Detalhes do Processo (CaseDetailModal)

**Abas:**

**1. Informações Básicas**

```
Número do Processo: _____________ (formatado automaticamente)
Título: ____________________
Tribunal: [TJSP ▼]
Comarca: __________________
Vara: _____________________
Tipo: [Cível ▼]
Status: [Ativo ▼] ☐ Auto-atualizar

Partes Envolvidas:
➕ Adicionar Cliente
  • João Silva (Cliente)          [🗑️]
  • Maria Santos (Testemunha)     [🗑️]

Datas:
  Distribuição: __/__/____
  Última movimentação: __/__/____ (auto)
  Encerramento: __/__/____

Valor da Causa: R$ __________
Parte Contrária: __________________

Observações:
[_________________________________]
[_________________________________]

Tags: [urgente] [aposentadoria] [+]
```

**2. Timeline (Publicações)**

```
📅 20/02/2026 - Intimação
"INTIMAÇÃO ELETRÔNICA... [ver mais]"
TJSP • 2ª Vara Cível

📅 15/02/2026 - Despacho
"O Juízo defere a dilação... [ver mais]"
TJSP • 2ª Vara Cível

📅 10/02/2026 - Intimação
"Fica a parte intimada para... [ver mais]"
TJSP • 2ª Vara Cível
```

**3. Prazos (Futura integração com Agenda)**

```
🔴 URGENTE - Prazo para contestação (falta 2 dias)
🟡 ATENÇÃO - Audiência de conciliação (falta 5 dias)
🟢 NORMAL - Prazo para perícia (falta 30 dias)
```

**4. Estatísticas**

```
Total de publicações: 12
Publicações recentes (30d): 3
Tempo médio entre intimações: 8 dias
Última movimentação: há 2 dias
Processo criado há: 245 dias
```

---

## 6. Features Avançadas

### 6.1 Auto-Vinculação Inteligente

**Cenário**: Publicação chega com `numero_processo`

```python
# Signal em publications/signals.py
@receiver(post_save, sender=Publication)
def auto_link_to_case(sender, instance, created, **kwargs):
    """
    Quando uma publicação é salva, tenta vincular automaticamente ao Case.
    """
    if created and instance.numero_processo and not instance.case:
        try:
            case = Case.objects.get(
                numero_processo_unformatted=instance.numero_processo.replace('-', '').replace('.', '')
            )
            instance.case = case
            instance.save(update_fields=['case'])

            # Atualizar data_ultima_movimentacao do case
            if not case.data_ultima_movimentacao or instance.data_disponibilizacao > case.data_ultima_movimentacao:
                case.data_ultima_movimentacao = instance.data_disponibilizacao
                case.save(update_fields=['data_ultima_movimentacao'])

        except Case.DoesNotExist:
            # Case não existe ainda, publicação fica órfã até Case ser criado
            pass
```

### 6.2 Status Automático (Background Task)

```python
# management/commands/update_case_status.py
from django.core.management.base import BaseCommand
from apps.cases.models import Case

class Command(BaseCommand):
    help = 'Atualiza status automático de todos os processos'

    def handle(self, *args, **kwargs):
        cases = Case.objects.filter(auto_status=True, deleted=False)
        updated = 0

        for case in cases:
            status_anterior = case.status
            case.atualizar_status_automatico()

            if case.status != status_anterior:
                updated += 1
                self.stdout.write(
                    f"Case {case.numero_processo}: {status_anterior} → {case.status}"
                )

        self.stdout.write(
            self.style.SUCCESS(f'✅ {updated} processos atualizados')
        )
```

**Agendar** (cron diário):

```bash
0 6 * * * cd /path/to/project && python manage.py update_case_status
```

### 6.3 Dashboard Consolidado

```python
# View para dashboard
@api_view(['GET'])
def cases_dashboard(request):
    """
    Estatísticas consolidadas de processos.
    """
    cases = Case.objects.filter(deleted=False)

    return Response({
        'total': cases.count(),
        'ativos': cases.filter(status='ATIVO').count(),
        'inativos': cases.filter(status='INATIVO').count(),
        'suspensos': cases.filter(status='SUSPENSO').count(),
        'arquivados': cases.filter(status='ARQUIVADO').count(),
        'encerrados': cases.filter(status='ENCERRADO').count(),
        'com_urgencia': cases.filter(
            publications__texto_completo__icontains='prazo'
        ).distinct().count(),
        'publicacoes_hoje': Publication.objects.filter(
            case__isnull=False,
            data_disponibilizacao=timezone.now().date(),
            deleted=False
        ).count(),
        'processos_sem_movimentacao_30d': cases.filter(
            data_ultima_movimentacao__lt=timezone.now().date() - timedelta(days=30)
        ).count(),
    })
```

### 6.4 Cadastro Inteligente a partir de Publicação Órfã 🚀

**Status**: Feature avançada - **Decidir quando implementar**

#### Extração Automática de Dados

```python
# apps/publications/utils.py
import re

def extract_case_data_from_publication(publication):
    """
    Extrai dados do Case a partir da publicação para preencher form automaticamente.
    """
    data = {
        'numero_processo': publication.numero_processo or '',
        'tribunal': publication.tribunal,
        'data_distribuicao': publication.data_disponibilizacao,  # Estimativa
        'titulo': '',
        'vara': '',
    }

    # Tentar extrair informações do texto
    texto = publication.texto_completo.lower()

    # Extrai tipo de ação do texto (heurística)
    padroes_tipo = {
        'CIVEL': ['ação de cobrança', 'ação cível', 'execução de título', 'embargos'],
        'TRABALHISTA': ['reclamação trabalhista', 'ação trabalhista', 'rescisão'],
        'FAMILIA': ['ação de alimentos', 'divórcio', 'guarda', 'inventário'],
        'CRIMINAL': ['ação penal', 'denúncia', 'inquérito'],
        'TRIBUTARIA': ['mandado de segurança', 'execução fiscal', 'ação tributária'],
    }

    for tipo, keywords in padroes_tipo.items():
        if any(kw in texto for kw in keywords):
            data['tipo_acao'] = tipo
            break

    # Extrai vara/órgão (se disponível no campo orgao)
    if publication.orgao:
        data['vara'] = publication.orgao[:200]  # Limita ao tamanho do campo

    # Gera título sugerido baseado no tipo de comunicação e número
    tipo_com = publication.tipo_comunicacao
    num_proc = publication.numero_processo[:20] if publication.numero_processo else "S/N"
    data['titulo'] = f"{tipo_com} - Processo {num_proc}"

    return data


# apps/cases/views.py
@api_view(['POST'])
def create_case_from_publication(request, publication_id):
    """
    Cria Case a partir de publicação órfã com dados pré-preenchidos.

    POST /api/cases/from-publication/{publication_id}/
    Body: {
        "mode": "save" | "draft",
        "case_data": { ... dados do formulário ... }
    }
    """
    try:
        publication = Publication.objects.get(id_api=publication_id, deleted=False)

        # Verificar se já tem case vinculado
        if publication.case:
            return Response({
                'error': 'Publicação já está vinculada a um processo'
            }, status=status.HTTP_400_BAD_REQUEST)

        mode = request.data.get('mode', 'save')
        case_data = request.data.get('case_data', {})

        # Criar Case
        case = Case.objects.create(**case_data)

        # Se modo rascunho, adicionar flag (futuro: adicionar campo no model)
        # case.is_draft = (mode == 'draft')

        # Vincular publicação
        publication.case = case
        publication.save(update_fields=['case'])

        # Atualizar data_ultima_movimentacao
        case.data_ultima_movimentacao = publication.data_disponibilizacao
        case.save(update_fields=['data_ultima_movimentacao'])

        return Response({
            'success': True,
            'case': CaseSerializer(case).data,
            'message': f'Processo cadastrado e publicação vinculada com sucesso'
        }, status=status.HTTP_201_CREATED)

    except Publication.DoesNotExist:
        return Response({
            'error': 'Publicação não encontrada'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
```

#### Frontend: SmartForm Component

```jsx
// components/CreateCaseFromPublicationModal.jsx
export default function CreateCaseFromPublicationModal({ publication, onClose, onCreated }) {
  const [formData, setFormData] = useState({});
  const [mode, setMode] = useState('save'); // 'save' | 'draft'

  useEffect(() => {
    // Preencher automaticamente com dados da publicação
    setFormData({
      numero_processo: publication.numero_processo || '',
      tribunal: publication.tribunal,
      data_distribuicao: publication.data_disponibilizacao,
      titulo: `${publication.tipo_comunicacao} - ${publication.numero_processo}`,
      vara: publication.orgao || '',
      // Outros campos vazios para advogada completar
      comarca: '',
      tipo_acao: '',
      parte_contraria: '',
      observacoes: `Criado a partir da publicação (ID: ${publication.id_api})`,
    });
  }, [publication]);

  const handleSubmit = async () => {
    try {
      const response = await api.post(
        `/cases/from-publication/${publication.id_api}/`,
        { mode, case_data: formData }
      );

      toast.success('Processo cadastrado com sucesso!');
      onCreated(response.data.case);
      onClose();
    } catch (error) {
      toast.error('Erro ao cadastrar processo');
    }
  };

  return (
    <Modal>
      <h2>➕ Criar Processo a partir da Publicação</h2>

      <div className="auto-filled-notice">
        ℹ️ Dados preenchidos automaticamente. Revise e complete as informações.
      </div>

      {/* Formulário com campos pré-preenchidos */}
      <FormField label="Número do Processo" value={formData.numero_processo} readOnly />
      <FormField label="Tribunal" value={formData.tribunal} readOnly />
      <FormField label="Título" value={formData.titulo} onChange={...} />
      {/* ... outros campos ... */}

      <div className="action-buttons">
        <button onClick={() => { setMode('save'); handleSubmit(); }}>
          ✅ Salvar Agora
        </button>
        <button onClick={() => { setMode('draft'); handleSubmit(); }}>
          📝 Salvar Rascunho
        </button>
        <button onClick={onClose}>
          ❌ Ignorar
        </button>
      </div>
    </Modal>
  );
}
```

#### Badge "Sem Processo" na Publicação

```jsx
// components/PublicationCard.jsx
export default function PublicationCard({ publication, onCreateCase }) {
  return (
    <div className="publication-card">
      <div className="publication-header">
        {/* ... outros badges ... */}

        {!publication.case && (
          <div className="orphan-badge">
            <span className="badge badge-warning">Sem Processo</span>
            <button
              className="btn-create-case"
              onClick={() => onCreateCase(publication)}
              title="Criar processo a partir desta publicação"
            >
              ➕ Criar Processo
            </button>
          </div>
        )}
      </div>
      {/* ... resto do card ... */}
    </div>
  );
}
```

**CSS**:

```css
.orphan-badge {
  display: flex;
  align-items: center;
  gap: 8px;
}

.badge-warning {
  background: #fbbf24;
  color: #78350f;
}

.btn-create-case {
  font-size: 0.875rem;
  padding: 4px 8px;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-create-case:hover {
  background: #059669;
  transform: scale(1.05);
}
```

---

## 7. Fluxo de Trabalho Completo

### 7.1 Cenário: Nova Publicação Chega

```
1. [Publications] Busca API retorna nova publicação
   └─ numero_processo: 0001234-56.2024.8.26.0100

2. [Signal] Post-save tenta auto-vincular
   └─ Case existe?
      ├─ SIM → Vincula automaticamente
      └─ NÃO → Publicação fica órfã (case=null)

3. [Case] Se vinculado, atualiza data_ultima_movimentacao

4. [Notification] Cria notificação para advogada
   └─ "Nova intimação no processo 0001234-56"

5. [Frontend] Advogada vê:
   ├─ Notificação no sino
   ├─ Badge no processo na lista de Cases
   └─ Publicação na timeline do Case
```

### 7.2 Cenário: Criar Novo Processo

```
1. [Frontend] Advogada clica "Novo Processo"

2. [Form] Preenche dados:
   ├─ Número CNJ (formatação automática)
   ├─ Título
   ├─ Tribunal, Comarca, Vara
   └─ Vincula clientes

3. [Backend] Salva Case
   └─ Gera numero_processo_unformatted

4. [Auto-link] Busca publicações órfãs com mesmo número
   └─ Se encontrar, vincula automaticamente

5. [Frontend] Redireciona para detalhes do Case
   └─ Mostra timeline com publicações já vinculadas
```

### 7.3 Cenário: Cadastro Rápido de Processo a partir de Publicação Órfã 🚀

**📌 DECISÃO DE IMPLEMENTAÇÃO: Definir quando adicionar essa feature**

```
1. [Frontend] Advogada vê publicação sem processo vinculado
   └─ Badge "Sem Processo" visível no PublicationCard

2. [Action] Clica em "➕ Criar Processo" na publicação

3. [Smart Form] Modal abre com dados PRÉ-PREENCHIDOS:
   ├─ Número do processo: 0001234-56.2024.8.26.0100 (extraído)
   ├─ Tribunal: TJSP (já conhecido)
   ├─ Data de distribuição: [data da publicação]
   ├─ Título: [sugestão baseada no texto da publicação]
   └─ Campos vazios: Comarca, Vara, Cliente (para completar)

4. [Opções de Salvamento]:
   ┌─────────────────────────────────────────────────────┐
   │ ✅ Salvar Agora                                     │
   │    → Cria Case completo e vincula publicação        │
   │                                                      │
   │ 📝 Salvar Rascunho                                  │
   │    → Cria Case pendente, vincula pub, flag "draft" │
   │                                                      │
   │ ❌ Ignorar                                          │
   │    → Fecha modal, publicação continua órfã          │
   └─────────────────────────────────────────────────────┘

5. [Backend] Se "Salvar Agora" ou "Rascunho":
   ├─ Cria Case (com ou sem flag draft)
   ├─ Vincula publicação automaticamente
   ├─ Atualiza data_ultima_movimentacao
   └─ Remove badge "Sem Processo"

6. [UX] Advogada pode:
   ├─ Completar cadastro depois (se rascunho)
   ├─ Ver processo na lista de Cases
   └─ Timeline já mostra a publicação vinculada
```

**Benefícios**:

- ✅ Agiliza cadastro (dados já preenchidos)
- ✅ Reduz erros de digitação (número CNJ copiado automaticamente)
- ✅ Contexto completo (advogada vê a publicação enquanto cadastra)
- ✅ Flexibilidade (pode salvar incompleto e completar depois)
- ✅ Workflow natural (da publicação para o processo)

**Implementação**:

- **Fase 3**: Adicionar botão na publicação órfã
- **Fase 4**: Implementar SmartForm com auto-preenchimento
- **Fase 5**: Adicionar modo "rascunho" (opcional)

---

## 8. Implementação Progressiva

### Fase 1: Modelo e CRUD Básico ✅

- [ ] Criar app `cases`
- [ ] Model `Case` com todos os campos
- [ ] Model `CaseParty` (tabela intermediária)
- [ ] Migrations
- [ ] Admin Django
- [ ] API ViewSet básico
- [ ] Serializers
- [ ] Testes unitários

### Fase 2: Frontend Básico ✅

- [ ] CasesPage (lista)
- [ ] CaseCard component
- [ ] CaseDetailModal (CRUD)
- [ ] Máscara CNJ em utils/masks.js
- [ ] Validação de número CNJ
- [ ] Formulário completo

### Fase 3: Integração com Publications ✅

- [ ] Adicionar ForeignKey `case` em Publication
- [ ] Migration para alterar Publication
- [ ] Signal de auto-vinculação
- [ ] Command para vincular publicações órfãs
- [ ] Timeline no frontend (tab "Publicações")

### Fase 4: Relacionamento com Contacts ✅

- [ ] Interface para adicionar/remover partes
- [ ] Dropdown de clientes existentes
- [ ] Indicação de papel (Cliente, Réu, etc)
- [ ] Badge nos contatos mostrando processos

### Fase 5: Features Avançadas ✅

- [ ] Status automático (comando + cron)
- [ ] Dashboard de estatísticas
- [ ] Busca avançada
- [ ] Filtros contextuais
- [ ] Analytics por processo

### Fase 5.1: Cadastro Inteligente (Feature Extra) 🚀

**⚠️ DECISÃO PENDENTE**: Definir quando implementar essa feature

**Opções:**

1. **Implementar junto com Fase 3** (integração com Publications)
   - ✅ Fluxo completo desde o início
   - ❌ Mais complexidade inicial
2. **Implementar após Fase 5** (quando CRUD básico estiver sólido)
   - ✅ Base sólida para construir em cima
   - ✅ Menos riscos
   - ❌ Usuária precisa cadastrar manualmente no início

3. **Implementar versão simplificada na Fase 3**
   - ✅ Badge "Sem Processo" + link para form normal
   - ✅ Sem auto-preenchimento no primeiro momento
   - ➕ Auto-preenchimento adicionado depois

**Recomendação**: **Opção 3** - Implementação progressiva

- Fase 3: Badge + botão simples
- Fase 5.1: Auto-preenchimento inteligente
- Fase 5.2: Modo rascunho (opcional)

**Tarefas (quando aprovada):**

- [ ] Badge "Sem Processo" em PublicationCard
- [ ] Botão "Criar Processo" na publicação órfã
- [ ] Função extract_case_data_from_publication()
- [ ] Endpoint create_case_from_publication()
- [ ] CreateCaseFromPublicationModal component
- [ ] Auto-preenchimento de campos
- [ ] Opções: Salvar Agora / Rascunho / Ignorar
- [ ] Testes de extração de dados
- [ ] Documentação de UX

### Fase 6: Integração com Agenda (Futuro)

- [ ] Vincular prazos aos processos
- [ ] Alertas de urgência
- [ ] Auto-criação de prazos a partir de publicações

---

## 9. Pontos de Atenção

### 9.1 Performance

**Problema**: Timeline pode ficar lenta com muitas publicações

**Solução**:

- Paginação na timeline (20 por página)
- Lazy loading ao scroll
- Cache de contadores (total_publicacoes)

### 9.2 Unicidade do Número CNJ

**Problema**: Mesmo processo pode ter variações no formato

**Solução**:

- Sempre salvar versão limpa em `numero_processo_unformatted`
- Busca sempre usando versão limpa
- Validação no frontend e backend

### 9.3 Publicações Órfãs

**Problema**: Publicações chegam antes do processo ser cadastrado

**Solução**:

1. **Permitir publicações sem `case`** ✅
   - Publicações ficam visíveis normalmente
   - Badge "Sem Processo" para identificação rápida
2. **Cadastro rápido a partir da publicação** 🚀 **(DECISÃO PENDENTE: quando implementar)**
   - Botão "➕ Criar Processo" na própria publicação órfã
   - Form modal auto-preenchido com dados da publicação:
     - Número do processo (extraído automaticamente)
     - Tribunal (já conhecido)
     - Data de distribuição (data da publicação)
     - Título sugerido baseado no texto
   - Opções:
     - **"Salvar Agora"**: Cria Case imediatamente e vincula
     - **"Salvar Rascunho"**: Cria Case pendente de complementação
     - **"Ignorar"**: Deixa órfã para cadastrar depois
3. **Command para vincular órfãs** ✅
   - `python manage.py link_orphan_publications`
   - Executa após criar Cases novos
   - Relatório: "X publicações vinculadas a Y processos"
4. **Notificação contextual** ✅
   - Badge no topo: "5 publicações aguardando cadastro de processo"
   - Click → Lista filtrada de órfãs
   - Botão "Cadastrar Processos em Lote" (verificar viabilidade)

### 9.4 Sincronização de Status

**Problema**: Status pode ficar desatualizado

**Solução**:

- Comando diário em cron
- Recalcular ao abrir detalhes do Case
- Signal ao salvar nova publicação vinculada

---

## 10. Próximos Passos

### Hoje (21/02/2026)

- [x] Estudo completo (este documento)
- [ ] Revisão com usuário
- [ ] Aprovar estrutura do modelo
- [ ] Aprovar design do frontend

### Amanhã (22/02/2026)

- [ ] Criar app `cases`
- [ ] Implementar models
- [ ] Migrations
- [ ] Testes básicos
- [ ] API CRUD
- [ ] Frontend começar (lista + card)

### Semana 1

- Concluir Fases 1-3
- Cases funcionando com auto-vinculação

### Semana 2

- Fases 4-5
- Sistema completo exceto Agenda

---

## 11. Decisões Técnicas

### 11.1 Por que ManyToMany com through?

**Resposta**: Flexibilidade para especificar o papel de cada parte (Cliente, Réu, Testemunha, etc) e adicionar observações específicas sobre a participação.

### 11.2 Por que `numero_processo_unformatted`?

**Resposta**:

- Busca mais rápida (sem precisar remover formatação)
- Tolerante a variações de formato
- Comparações simples

### 11.3 Por que soft delete em Cases?

**Resposta**:

- Auditoria legal (mesmo motivo de Publications)
- Possibilidade de restauração
- Histórico completo preservado

### 11.4 Por que status automático é opcional?

**Resposta**:

- Advogada pode querer controle manual
- Alguns processos suspensos não devem virar "Inativos"
- Flexibilidade para regras de negócio específicas

### 11.5 Quando implementar "Cadastro Inteligente" a partir de publicação órfã?

**Problema**: Publicações chegam sem processo cadastrado. Advogada precisa criar Case manualmente.

**Solução Proposta**: Botão "Criar Processo" na publicação órfã que auto-preenche form com dados extraídos.

**Decisão**: ⏳ **PENDENTE - Definir durante implementação de Cases**

**Opções Discutidas**:

1. Implementar junto com integração de Publications (Fase 3)
2. Implementar após CRUD básico estar sólido (Fase 5+)
3. **Implementação progressiva** (RECOMENDADO):
   - Fase 3: Badge + botão básico
   - Fase 5.1: Auto-preenchimento inteligente
   - Fase 5.2: Modo rascunho

**Benefícios da implementação**:

- ✅ Reduz trabalho manual da advogada
- ✅ Elimina erros de digitação (número CNJ copiado)
- ✅ Workflow natural (da publicação → processo)
- ✅ Contexto completo durante cadastro

**Complexidade adicional**:

- ⚠️ Extração de dados do texto (heurística)
- ⚠️ Validação de dados extraídos
- ⚠️ UX mais complexa (3 botões: Salvar/Rascunho/Ignorar)

**Prioridade**: 🟡 **Média-Alta** (melhora UX mas não é crítico para MVP)

---

## 12. Conclusão

O módulo **Cases** é o **coração do sistema** e deve ser implementado com:

✅ **Solidez**: Modelo robusto com relacionamentos bem definidos  
✅ **Inteligência**: Auto-vinculação e status automático  
✅ **Flexibilidade**: Suporta workflow manual e automático  
✅ **Escalabilidade**: Preparado para milhares de processos  
✅ **Usabilidade**: Interface intuitiva focada no trabalho da advogada  
✅ **Valor agregado**: Features além do pedido inicial

**Decisão Pendente para discussão**:
⏳ **Cadastro Inteligente de Cases a partir de Publicações Órfãs**

- Ver seção 6.4, 7.3, e 11.5 para detalhes completos
- Recomendação: Implementação progressiva (badge → auto-preenchimento → rascunho)
- Definir prioridade: MVP (Fase 3) vs. Feature adicional (Fase 5.1)

**Este módulo unifica todo o sistema e deve ser a prioridade máxima.**

---

**Próxima ação**:

1. Revisar este documento com o usuário
2. **Decidir sobre "Cadastro Inteligente"**: implementar no MVP ou pós-MVP?
3. Aprovar estrutura do modelo e design do frontend
4. Iniciar implementação (Fase 1)
