---
type: refactor
id: WI-039
title: 'Persistencia, aislamiento de sesiones y seguridad del estado'
knowledge_level: K3
status: completed
phase: now
initiative: INI-008
domains:
  - architecture
  - security
  - experience
  - frontend
code:
  - packages/events-client/src/auth/token-store.ts
  - packages/events-client/src/auth/auth.test.ts
  - apps/client/src/App.tsx
  - apps/client/src/client.test.ts
created_at: '2026-10-12'
completed_at: '2026-10-12'
source: initiative
source_id: WI-CANDIDATE-009
source_initiative: INI-008
affected_modules:
  - reinvent-pathfinder
ready_at: '2026-10-12'
implementation_evidence:
  repositories:
    core:
      role: core
      status: completed
      changed_paths:
        - apps/client/src/App.tsx
        - apps/client/src/client.test.ts
        - packages/events-client/src/auth/auth.test.ts
        - packages/events-client/src/auth/token-store.ts
      validations:
        - pnpm -r test
        - pnpm -r build
        - pnpm -r lint
implementation_status: completed
validation_status: completed
verified_at: '2026-10-12'
---

# Persistencia, aislamiento de sesiones y seguridad del estado

> Materializado desde la Iniciativa INI-008, candidato WI-CANDIDATE-009.

## Problem

La persistencia del estado en el cliente (`pathfinder_journey_state`) utilizaba una clave global compartida sin aislamiento por modo de experiencia (`demo` vs `live`):
- Cambiar entre Modo Demo y Modo Live arrastraba en memoria y persistía el catálogo activo, los resultados de análisis, las trazas de IA, las brechas y las recomendaciones del modo anterior, produciendo contaminación cruzada de datos sintéticos con datos reales de AWS Events.
- Al recargar la página en un modo diferente, se restauraba el estado previo sin verificar la correspondencia del modo.
- El almacenamiento de tokens en `LocalStorageTokenStore` no contaba con una alternativa efímera a nivel de pestaña (`SessionStorageTokenStore`) para contextos que restringen almacenamiento permanente en disco.

## Acceptance Criteria

- [x] Soporte de `SessionStorageTokenStore` en `@pathfinder/events-client` con cobertura en pruebas unitarias.
- [x] Aislamiento estricto de almacenamiento de Journey por modo (`pathfinder_journey_state_demo` y `pathfinder_journey_state_live`) con migración retrocompatible para claves heredadas.
- [x] Transición limpia entre modos en `App.tsx`: al alternar entre Demo y Live, se guarda el progreso del modo actual y se restaura el estado guardado del modo objetivo (o estado inicial limpio si no tiene datos).
- [x] Validación de integridad de estado cargado: comprobación de esquema y rechazo de estados inconsistentes o corruptos.
- [x] Pruebas automatizadas de persistencia, aislamiento entre modos y conmutación de estado en `client.test.ts` y `auth.test.ts`.
- [x] Workspace limpio y compilando con `pnpm -r build`, `pnpm -r test` y `pnpm -r lint`.

## Out of scope

- Cifrado asimétrico en reposo en el navegador (excede alcance del cliente web local-first sin backend seguro dedicado).
- Cambios a la especificación de OAuth 2.0 PKCE de AWS Builder ID.

## Validation

- `pnpm -r build` compila limpiamente sin errores de tipos TypeScript.
- `pnpm -r test` pasa el 100% de tests unitarios en todos los paquetes.
- `pnpm -r lint` pasa con 0 errores y 0 advertencias.
- `kaddo verify WI-039 --yes` valida el cumplimiento de las metas.

## Learning

1. **Aislamiento estricto de estado por modo de experiencia**: Separar los buckets de almacenamiento local en `pathfinder_journey_state_demo` y `pathfinder_journey_state_live` erradica por completo la contaminación cruzada entre catálogos de fixtures sintéticos y datos de AWS Events en vivo.
2. **Conmutación atómica de Journey en memoria**: Guardar el progreso activo antes de alternar de modo y cargar inmediatamente el estado del modo destino permite al usuario explorar el modo Demo o autenticarse en Live sin perder el avance de ninguno de los dos recorridos.
3. **Resiliencia y migración de esquemas de almacenamiento**: Incorporar `migrateLegacyJourneyState()` garantiza que usuarios con estados previos en la clave unificada `pathfinder_journey_state` no sufran pérdida de datos al migrar a la nueva versión aislada.
4. **Token store efímero por pestaña**: La implementación de `SessionStorageTokenStore` en `@pathfinder/events-client` habilita entornos donde las políticas de seguridad restringen credenciales OAuth permanentes en `localStorage`.
