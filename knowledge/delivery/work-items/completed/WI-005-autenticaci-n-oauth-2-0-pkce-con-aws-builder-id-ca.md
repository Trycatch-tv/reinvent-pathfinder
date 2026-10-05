---
type: feature
id: WI-005
title: Autenticación OAuth 2.0 + PKCE con AWS Builder ID (callback local)
knowledge_level: K3
status: completed
phase: now
initiative: INI-002
domains:
  - aws-events
  - integration
code:
  - packages/events-client/**
created_at: '2026-10-05'
completed_at: '2026-10-05'
source: initiative
source_id: WI-CANDIDATE-002
source_initiative: INI-002
affected_modules:
  - reinvent-pathfinder
ready_at: '2026-10-05'
implementation_evidence:
  repositories:
    core:
      role: core
      status: completed
      changed_paths:
        - knowledge/delivery/initiatives/INI-002-integraci-n-con-aws-events.md
        - packages/events-client/src/auth/pkce.ts
        - packages/events-client/src/auth/token-store.ts
        - packages/events-client/src/auth/builder-id-client.ts
        - packages/events-client/src/auth/auth.test.ts
        - packages/events-client/src/client/aws-events-client.ts
        - packages/events-client/src/index.ts
      validations: []
implementation_status: completed
validation_status: completed
verified_at: '2026-10-05'
---

# Autenticación OAuth 2.0 + PKCE con AWS Builder ID (callback local)

> Materialized from Initiative INI-002, candidate WI-CANDIDATE-002.

## Outcome

- **Actor:** asistente a AWS re:Invent y cliente frontend/local (`apps/client`).
- **Current behavior:** el catálogo solo puede consultarse de forma anónima/pública. No existe mecanismo para autenticar al usuario contra AWS Builder ID, impidiendo el acceso a su agenda personal, reservas y favoritos en los siguientes Work Items.
- **Target behavior:** el asistente puede iniciar sesión mediante el estándar OAuth 2.0 con Proof Key for Code Exchange (PKCE) contra AWS Builder ID; los tokens resultantes se administran de forma estrictamente efímera (en memoria del cliente) y se integran de forma transparente con `AwsEventsClient` para llamadas autenticadas.
- **Observable completion:** existen utilidades criptográficas para generar `code_verifier`, `code_challenge` (S256) y `state`; un gestor de sesión `InMemoryTokenStore` con detección de expiración y refresco; y pruebas unitarias completas con Vitest que validan el ciclo de intercambio de código, protección contra CSRF y la inyección del Bearer token.

## Journey reconstruction

Flujo de autenticación con AWS Builder ID:

```text
Usuario solicita iniciar sesión en el cliente local
       ↓
Generación de code_verifier + code_challenge (SHA-256) + state (CSRF)
       ↓
Construcción de authorization_url → Redirección a AWS Builder ID
       ↓
Usuario autoriza en AWS Builder ID → Callback local con code + state
       ↓
Validación de state y canje: POST /token con code + code_verifier
       ↓
Tokens almacenados EXCLUSIVAMENTE en memoria (InMemoryTokenStore)
       ↓
AwsEventsClient inyecta Authorization: Bearer <access_token> para llamadas privadas
```

## Problem

Para acceder a las funciones personalizadas de la conferencia (agenda personal `GetSchedule`, favoritos y reservas de sesiones), se requiere autenticación con AWS Builder ID. Al mismo tiempo, por directriz estricta de seguridad y privacidad del proyecto ([codebase.md](file:///c:/Users/julia/Documents/repos/pathfinder-ws/reinvent-pathfinder/knowledge/tech/codebase.md#L363)), los tokens de AWS Builder ID **nunca** deben persistirse en almacenamiento permanente ni enviarse al backend propio de Pathfinder. Este Work Item provee la infraestructura de autenticación segura y local.

_Expected value:_ Habilita la experiencia autenticada con AWS Builder ID; tokens solo en memoria, nunca enviados al backend.

## Scope

- Implementar generadores criptográficos de PKCE en `packages/events-client/src/auth/pkce.ts`:
  - `generateCodeVerifier`: Cadena aleatoria de alta entropía (Base64URL).
  - `generateCodeChallenge`: Hash SHA-256 del verifier codificado en Base64URL (método `S256`).
  - `generateState`: Token aleatorio para mitigar ataques CSRF.
- Implementar generador de URLs de autorización (`buildAuthorizationUrl`) con parámetros: `client_id`, `redirect_uri`, `scope`, `state`, `code_challenge`, `code_challenge_method=S256`.
- Implementar `InMemoryTokenStore` en `packages/events-client/src/auth/token-store.ts`:
  - Almacenamiento seguro y efímero en memoria de `access_token`, `refresh_token`, `expires_at`.
  - Métodos `getAccessToken()`, `setTokens()`, `isExpired()`, `clear()`.
  - Cero persistencia en `localStorage`, `sessionStorage` o disco.
- Implementar cliente de autenticación (`AwsBuilderIdAuthClient` o `exchangeCodeForTokens` / `refreshTokens`) en `packages/events-client/src/auth/builder-id-client.ts`:
  - Validación de coincidencia de `state`.
  - Intercambio de `code` + `code_verifier` contra el endpoint de tokens.
  - Flujo de renovación usando `refresh_token`.
  - Soporte de modo simulado/mock (`MockAuthClient`) para desarrollo offline.
- Conectar el `TokenStore` con `AwsEventsClient` para inyectar automáticamente `Authorization: Bearer <token>` cuando la sesión esté activa.
- Pruebas unitarias completas con Vitest en `packages/events-client/src/auth/*.test.ts`:
  - Validez y formato de `code_verifier` y `code_challenge` S256.
  - Rechazo de callbacks con `state` inválido o alterado.
  - Intercambio exitoso de token y almacenamiento en memoria.
  - Expiración y renovación con `refresh_token`.
  - Comprobación de que `clear()` borra completamente los tokens de la memoria.

## Out of scope

- Endpoints de lectura de agenda (`GetSchedule`), favoritos o reservas (`WI-CANDIDATE-003`).
- Servidor web local HTTP temporal para capturar el redirect (se conectará en la UI / Electron / CLI).
- Transmisión de credenciales al backend de Pathfinder (estrictamente prohibido).

## Surface review

- **Product/UI:** not-applicable (capa de integración/seguridad).
- **Frontend:** reviewed — `apps/client` consumirá este flujo PKCE.
- **Backend:** reviewed-not-affected — el backend de Pathfinder **no** recibe tokens de AWS Builder ID.
- **AI/Agentic:** reviewed-not-affected.
- **Shared packages:** affected — `packages/events-client`.
- **Configuration:** not-applicable.
- **Database / Auth / Analytics:** affected — diseño de almacenamiento efímero en memoria.
- **Operations/release:** reviewed-not-affected.

## Acceptance Criteria

- [x] Generación de PKCE (`code_verifier`, `code_challenge` con SHA-256 / S256) y `state` anti-CSRF funcional.
- [x] Construcción de URL de autorización hacia AWS Builder ID con todos los parámetros obligatorios de OAuth 2.0 + PKCE.
- [x] `InMemoryTokenStore` almacena tokens exclusivamente en memoria, detecta expiración y provee método `clear()`.
- [x] Intercambio exitoso de código de autorización por tokens validando `state` y enviando `code_verifier`.
- [x] Soporte para renovación de tokens mediante `refresh_token` en memoria.
- [x] `AwsEventsClient` soporta integración con `TokenStore` para llamadas autenticadas.
- [x] Soporte de autenticación simulada (mock) para pruebas y desarrollo offline.
- [x] Suite de pruebas con Vitest en `packages/events-client` con 100% de tests aprobados.
- [x] **End-to-end:** `pnpm lint; pnpm typecheck; pnpm test` finalizan con código de salida 0 en todo el monorepo.

## Validation

- Ejecutar `pnpm typecheck` validando compatibilidad de tipos criptográficos y de autenticación.
- Ejecutar `pnpm test` verificando la cobertura de PKCE, validación de state, token store y refresco.
- Ejecutar `pnpm lint` verificando ausencia de errores.

## Learning

- La generación de PKCE con `node:crypto` (`createHash('sha256').digest('base64url')`) implementa con precisión el estándar RFC 7636 sin requerir dependencias externas adicionales.
- `InMemoryTokenStore` garantiza el estricto cumplimiento de privacidad y seguridad ([codebase.md](file:///c:/Users/julia/Documents/repos/pathfinder-ws/reinvent-pathfinder/knowledge/tech/codebase.md#L363)): los tokens de AWS Builder ID residen únicamente en RAM, nunca en almacenamiento persistente ni en llamadas al backend de Pathfinder.
- La inyección automática de headers `Authorization: Bearer <token>` desacopla `AwsEventsClient` de los detalles de autenticación y refresco de tokens.
