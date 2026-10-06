---
type: feature
id: WI-018
title: Integración del login con AWS Builder ID en apps/client
knowledge_level: K3
status: completed
phase: now
initiative: INI-007
domains:
  - aws-events
  - experience
related_domain: AWS Events
related_capabilities:
  - Integración con la agenda de AWS Events
code:
  - apps/client/src/App.tsx
  - apps/client/src/components/BuilderIdLogin.tsx
  - apps/client/src/auth/builder-id-transaction.ts
  - apps/client/src/client.test.ts
created_at: '2026-10-06'
source: initiative
source_id: WI-CANDIDATE-004
source_initiative: INI-007
affected_modules:
  - reinvent-pathfinder
scope_confidence: medium
refined_by: work-item-agent
project_state: ai-assisted
ready_at: '2026-10-06'
started_at: '2026-10-06'
implementation_evidence:
  repositories:
    reinvent-pathfinder:
      role: core
      status: completed
      changed_paths:
        - apps/client/src/App.tsx
        - apps/client/src/components/BuilderIdLogin.tsx
        - apps/client/src/auth/builder-id-transaction.ts
        - apps/client/src/client.test.ts
      validations:
        - command: corepack pnpm --filter @pathfinder/client test
          status: passed
          reason: >-
            14 pruebas del cliente en verde, incluidas transacción PKCE y
            callback.
        - command: corepack pnpm lint
          status: passed
          reason: ESLint finalizó sin errores.
        - command: corepack pnpm typecheck
          status: passed
          reason: Project references de TypeScript completaron sin errores.
        - command: corepack pnpm test
          status: passed
          reason: 114 pruebas del workspace en verde.
        - command: validación manual Builder ID
          status: passed
          reason: >-
            Confirmada por el usuario: login, callback y logout funcionaron;
            DevTools Storage no mostró tokens persistidos.
implementation_status: completed
validation_status: passed
verified_at: '2026-10-06'
completed_at: '2026-10-06'
---

# Integración del login con AWS Builder ID en apps/client

> Materialized from Initiative INI-007, candidate WI-CANDIDATE-004.

## Problem

El cliente contiene el flujo local-first y el paquete `@pathfinder/events-client` ya implementa OAuth 2.0 + PKCE, pero no existe una experiencia de login/logout ni un callback que conecte ambos de forma segura.

_Expected value:_ UI autenticada contra AWS Events mediante OAuth 2.0 + PKCE, sin persistir tokens en el navegador.

## Actor and Outcome

Como asistente, puedo iniciar sesión con AWS Builder ID desde Pathfinder, volver al callback local y ver un estado autenticado o un error accionable; puedo cerrar sesión y limpiar el estado de sesión.

## Current and Target State

Actualmente `AwsBuilderIdAuthClient` genera la URL de autorización, valida `state`, intercambia el código y guarda tokens en `InMemoryTokenStore`, pero `apps/client` no lo instancia ni maneja `/callback`. Tras este Work Item, el cliente inicia la autorización, completa el callback con PKCE y muestra el estado de autenticación sin exponer valores de token.

## Entry Points

- Acción de login desde la pantalla principal de `apps/client`.
- Callback local `http://localhost:8484/callback`.
- Acción de logout desde la UI autenticada.

## End-to-End Flow

Login → `AwsBuilderIdAuthClient.initiateAuth()` → guardar transitoriamente `state` y `code_verifier` en `sessionStorage` → redirect a Builder ID → retorno a `/callback?code=…&state=…` → leer y eliminar la transacción → `handleCallback()` valida estado e intercambia código → `InMemoryTokenStore` conserva tokens solo en RAM → UI muestra sesión autenticada. Logout → `authClient.logout()` → limpiar estado de UI y transacción pendiente.

## Scope

- Crear una capa local de transacción OAuth que guarde exclusivamente `state` y `code_verifier` en `sessionStorage` y los elimine después de usarlos o al hacer logout.
- Instanciar `AwsBuilderIdAuthClient` con `InMemoryTokenStore` en el cliente, con `redirectUri` local `http://localhost:8484/callback`.
- Incorporar controles de login, estado de callback, sesión autenticada, error y logout en `apps/client`.
- Leer `code`, `state` y errores OAuth desde la URL de callback, sin renderizar ni registrar tokens, authorization code, verifier o state.
- Añadir pruebas con un cliente de autenticación controlado para inicio, callback válido, callback inválido y logout.

## Security Constraints

- `accessToken`, `refreshToken`, `idToken` y perfiles no se escriben en `localStorage`, `sessionStorage`, IndexedDB, cookies, URL, logs ni UI.
- Solo `state` y `code_verifier` se guardan temporalmente en `sessionStorage`, por autorización explícita; se eliminan después del callback o logout.
- La UI nunca muestra valores de token, código de autorización, verifier ni state.
- El callback debe tratar un `state` ausente, expirado o distinto como error seguro, sin intercambio de token.

## Affected Surfaces

| Surface | Impact |
| --- | --- |
| Frontend / `apps/client` | Affected: controles de sesión, callback, transacción temporal y pruebas. |
| AWS Events adapter | Reviewed, not changed: reutiliza `AwsBuilderIdAuthClient` e `InMemoryTokenStore` públicos. |
| Authentication / authorization | Affected: OAuth PKCE, validación CSRF, manejo de errores y logout. |
| Backend, database, AI | Not applicable: los tokens no llegan a servicios propios. |
| Configuration / release | Reviewed, not changed: conserva callback en puerto local 8484; credenciales reales se validan manualmente. |
| Documentation | Affected: evidencia, límites de almacenamiento y aprendizaje al cerrar. |

## Module Coverage

- `reinvent-pathfinder` — affected: `apps/client` integra el flujo y mantiene su estado local.

## Scope Unknowns

- La configuración real de Builder ID, allowlist de callback y CORS debe verificarse manualmente con credenciales autorizadas; el cliente no debe incorporar secretos para suplirla.
- La UI no implementará refresh automático; esa política se mantiene en el adapter y se consumirá en un Work Item posterior cuando exista catálogo live.

## Acceptance Criteria

- [x] El login inicia una autorización mediante `AwsBuilderIdAuthClient.initiateAuth()` y navega a la URL devuelta, sin escribir tokens en almacenamiento persistente.
- [x] Antes del redirect, el cliente almacena solo `state` y `code_verifier` en `sessionStorage`; ambos se eliminan después de procesar callback, error o logout.
- [x] `/callback` procesa `code` y `state`, valida el estado con `handleCallback()` y muestra sesión autenticada sin revelar secretos.
- [x] Un callback sin código, con error OAuth o con state inválido muestra un mensaje seguro y no autentica al usuario.
- [x] Logout limpia `InMemoryTokenStore`, transacción temporal y estado visible de sesión.
- [x] Las pruebas cubren inicio, callback válido, callback inválido y logout sin red ni credenciales reales.
- [x] Validación end-to-end manual con Builder ID autorizado: login → callback → estado autenticado → logout; los tokens no aparecen en DevTools Storage.

## Out of Scope

- Catálogo live, refresh de tokens, disponibilidad real, agenda, favoritos, reservas o cancelaciones.
- Backend proxy, cookies, persistencia de perfil, sincronización entre pestañas o autenticación de servicios propios.
- Modificar los endpoints, client ID o comportamiento interno de `@pathfinder/events-client`.
- Proveer, rotar o versionar secretos/configuración real de Builder ID.

## Validation

```bash
corepack pnpm --filter @pathfinder/client test
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
kaddo guard
```

Validación manual: con una configuración Builder ID autorizada, iniciar login desde `http://localhost:8484`, completar callback, confirmar estado autenticado y ejecutar logout. Inspeccionar DevTools Storage para verificar que no existan tokens; solo puede existir una transacción PKCE temporal antes del callback.

## Definition of Done

- Login, callback y logout funcionan contra el contrato existente de `@pathfinder/events-client`.
- Los tokens viven solo en `InMemoryTokenStore`; `sessionStorage` contiene únicamente `state` y `code_verifier` durante una transacción activa.
- Estados de éxito y error son accesibles y no filtran secretos.
- Pruebas locales y validación manual de seguridad documentada.
- Evidencia de implementación y `kaddo verify WI-018 --yes` completados antes de solicitar cierre.

## Open Questions

No hay preguntas abiertas bloqueantes para el código local. La disponibilidad de configuración Builder ID real se valida como requisito manual externo y no debe resolverse con secretos en el repositorio.

## Suggested Ownership

- `apps/client/src/App.tsx`
- `apps/client/src/components/BuilderIdLogin.tsx`
- `apps/client/src/auth/builder-id-transaction.ts`
- `apps/client/src/client.test.ts`

## Learning

Mantener tokens solo en memoria y persistir temporalmente unicamente state y code_verifier permite completar PKCE tras el redirect sin exponer secretos en el almacenamiento del navegador.
