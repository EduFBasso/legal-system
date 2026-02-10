# Publications Module Specification

## Overview

The Publications module (`publications` app) ingests legal publications from the PJe Comunica API, normalizes them, and stores them locally for review and linking to cases.

## API Source

- **Endpoint**: `GET https://comunicaapi.pje.jus.br/api/v1/comunicacao`
- **Authentication**: None (public)
- **Rate Limit**: 20 requests per minute (X-RateLimit-Limit header)
- **Response Format**: JSON with `status`, `message`, `count`, and `items`

## Query Parameters

| Parameter | Type | Example | Required | Notes |
|-----------|------|---------|----------|-------|
| `siglaTribunal` | string | TJSP | No | Court abbreviation. Default: all courts |
| `dataDisponibilizacaoInicio` | date | 2026-01-30 | No | Start date (YYYY-MM-DD) |
| `dataDisponibilizacaoFim` | date | 2026-02-02 | No | End date (YYYY-MM-DD) |
| `numeroOab` | string | 507553 | No | OAB number (without state/UF) |
| `numeroProcesso` | string | 1003498-11.2021.8.26.0533 | No | Process number (full format) |
| `nomeAdvogado` | string | Vitoria Rocha | No | Lawyer name (partial match) |
| `uf` | string | SP | No | State code for OAB |

## Data Model

### Publication (Django Model)

```python
class Publication(models.Model):
    # External reference
    id_api = models.BigIntegerField(unique=True)
    hash_dedup = models.CharField(max_length=50, unique=True)  # Deduplication hash
    
    # Core data
    numero_processo = models.CharField(max_length=30, db_index=True, null=True, blank=True)
    tribunal = models.CharField(max_length=10, db_index=True)  # e.g., TJSP
    tipo_comunicacao = models.CharField(max_length=50)  # e.g., Intimação, Despacho
    data_disponibilizacao = models.DateField(db_index=True)
    
    # Organizational data
    orgao = models.CharField(max_length=255, blank=True)
    meio = models.CharField(max_length=100, blank=True)  # e.g., Diário da Justiça Eletrônico Nacional
    
    # Content
    texto_resumo = models.TextField(max_length=500)
    texto_completo = models.TextField()
    
    # Status & linking
    status = models.CharField(
        max_length=20,
        choices=[('novo', 'Novo'), ('lido', 'Lido'), ('vinculado', 'Vinculado'), ('descartado', 'Descartado')],
        default='novo'
    )
    case = models.ForeignKey('cases.Case', on_delete=models.SET_NULL, null=True, blank=True, related_name='publications')
    
    # Metadata
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-data_disponibilizacao', '-criado_em']
        indexes = [
            models.Index(fields=['tribunal', '-data_disponibilizacao']),
            models.Index(fields=['numero_processo']),
            models.Index(fields=['status']),
        ]
```

## Workflow

### 1. Ingestion (Manual or Scheduled)
- User triggers fetch (button in UI) or scheduled daily job.
- Python service queries PJe API with parameters.
- New publications stored with `status='novo'`.
- Deduplication via `hash_dedup` prevents duplicates.

### 2. Review & Linking
- User sees "Novo" publications in the Publications view.
- Can manually link to a case or mark as read.
- System attempts auto-linking via `numero_processo` if case already exists.
- Mark as `descartado` if not relevant.

### 3. Alert Generation
- When a publication is linked to a case, check if it contains alert keywords (e.g., "prazo", "julgamento").
- Create an `Alert` if necessary.

## Integration Points

- **Cases**: Foreign Key to link publication to a process.
- **Alerts**: Trigger alert creation on publication linking.
- **Dashboard**: Display count of `novo` publications.

## Service Layer

### PublicationService

```python
class PublicationService:
    @staticmethod
    def fetch_from_pje(tribunal='TJSP', data_inicio=None, data_fim=None, numero_oab=None):
        """Query PJe API and return raw items."""
        # Implementation here
        
    @staticmethod
    def ingest_publications(items, source='pje_comunica'):
        """Normalize items and store in DB, skipping duplicates."""
        # Implementation here
        
    @staticmethod
    def auto_link_to_cases():
        """Attempt to link publications to existing cases by numero_processo."""
        # Implementation here
```

## API Endpoints (REST)

- `GET /api/v1/publications/` - List publications (filtered by status, tribunal, date range)
- `POST /api/v1/publications/fetch/` - Trigger fetch from PJe
- `GET /api/v1/publications/{id}/` - Retrieve single publication
- `PATCH /api/v1/publications/{id}/` - Update status or link to case
- `DELETE /api/v1/publications/{id}/` - Soft delete (mark as descartado)

## Testing

- Unit tests for PJe API client (mock responses).
- Integration tests for ingestion workflow.
- End-to-end test with real API (limited to 1 request to respect rate limits).

## Future Enhancements

- Support for additional sources (TRF3, TRT15, TJSP direct).
- Full-text search on `texto_completo`.
- Webhook for external systems to push publications.
- LGPD compliance: audit log for all access to publications.
