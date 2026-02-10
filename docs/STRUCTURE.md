# Project Structure

This document describes the initial folder layout and responsibilities.

## Top-level

- backend/ : Django backend (API, services, data access).
- frontend/ : Vite + React frontend (SPA).
- infra/ : Local scripts and operational helpers.
- docs/ : Technical and functional documentation.
- data/ : Local development data and fixtures.

## Backend

- backend/config/ : Django settings, URLs, WSGI/ASGI.
- backend/apps/ : Domain apps (core, agenda, publicacoes, auditoria, users).
- backend/api/ : Serializers, viewsets, routers.
- backend/services/ : Integrations and complex business rules.
- backend/storage/ : File storage and attachments.

## Frontend

- frontend/src/ : Application source code.

## Notes

This structure supports a local-first setup and a future move to LAN and online usage.
