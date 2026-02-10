# Product Notes

This document consolidates early observations from the EASYJUR workflow video and will be refined as more details are reviewed.

## Layout Overview

- Header
  - Company name
  - Alert bell icon
  - Time icon
  - Plus button
  - Greeting on the far right (e.g., "Ola, Vitoria")

- Left sidebar (table-style list with icons)
  - Dashboard
  - SmartDocs
  - Juris
  - Agenda
  - Pessoas
  - Novos Negocios
  - Processos e Casos
  - Movimentacoes
  - Projetos Consultivos

- Main area
  - "Atenda" section with status buckets:
    - Em aberto
    - Data fatal (hoje)
    - Atrasados
    - Periodo fatal
  - Right-side mini cards: "Intimacoes e Publicacoes"
    - Pendentes de providencia
    - Prazos cadastrados hoje
    - Lidas hoje sem prazo cadastrado
    - Excluidas hoje

## Agenda (Monthly View)

- Full-screen monthly calendar layout (desktop)
- Week header: Dom a Sab
- Each day cell contains inline labels (rectangular, colored background, white text)
- Label types observed:
  - TAREFA (appears to be a notification/task)
  - PRAZO
  - JULGAMENTO
- Urgent label behavior:
  - Red background indicates URGENTE
- Click on a day (expand) shows document/task details
- Observed data fields include multiple dates (Interna, Fatal, Cadastro)

## Observations / Opportunities

- Incomplete or inconsistent date entry suggests UX improvements are possible
- We can simplify the cadastro flow and enforce consistency
- Consider validation rules and defaults to reduce incorrect entries

## Pending Clarifications

- Full list of data fields per module (Clients, Cases, Agenda, Publications)
- Exact rules for "Data fatal" and "Periodo fatal"
- Publicacoes integration details and how they are linked to cases
- Alert and notification behavior for local vs online usage

## Next Steps

- Continue video review and refine these notes
- Convert notes into functional requirements and wireframe specifications
