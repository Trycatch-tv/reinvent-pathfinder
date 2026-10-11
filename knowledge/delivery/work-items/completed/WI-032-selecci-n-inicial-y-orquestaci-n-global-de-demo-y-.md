---
type: feature
id: WI-032
title: Selección inicial y orquestación global de Demo y Live
knowledge_level: K3
status: completed
completed_at: '2026-10-11'
phase: now
initiative: INI-008
domains:
  - product
  - experience
  - frontend
  - architecture
code:
  - packages/domain/src/types/
  - apps/client/src/App.tsx
  - apps/client/src/components/
  - apps/client/src/client.test.ts
created_at: '2026-10-11'
source: initiative
source_id: WI-CANDIDATE-003
source_initiative: INI-008
affected_modules:
  - reinvent-pathfinder
ready_at: '2026-10-11'
implementation_evidence:
  repositories:
    core:
      role: core
      status: in-progress
      changed_paths:
        - apps/client/src/App.tsx
        - apps/client/src/client.test.ts
        - >-
          knowledge/delivery/initiatives/INI-008-experiencia-unificada-orquestaci-n-de-modos-y-traza.md
        - packages/domain/src/index.ts
      validations: []
implementation_status: in-progress
validation_status: in-progress
verified_at: '2026-10-11'
---

# Selección inicial y orquestación global de Demo y Live

> Materializado desde la Iniciativa INI-008, candidato WI-CANDIDATE-003.

## Outcome Framing

- **Actor:** Usuario que abre Pathfinder, ya sea un evaluador/asistente sin credenciales que desea explorar el flujo ("Modo Demo") o un asistente registrado con AWS Builder ID ("Modo Live").
- **Current Behavior:** La experiencia no posee un concepto formal de modo en el dominio; en `App.tsx` coexisten estados booleanos dispersos y un botón "Quick Demo Login" que simula un access token en `LocalStorageTokenStore`, creando la ilusión de que el usuario está autenticado con Builder ID cuando no lo está.
- **Target Behavior:** El tipo `ExperienceMode = 'demo' | 'live'` forma parte del dominio. El usuario selecciona explícitamente su modo al inicio. El modo gobierna de forma inmutable la política de autenticación, las fuentes de datos y las acciones habilitadas sin inyectar tokens falsos en Demo ni recurrir silenciosamente a fixtures en Live.
- **Observable Completion:** Contrato `ExperienceMode` en `@pathfinder/domain`, selector inicial de modo en la UI, banner/indicador visible del modo activo durante todo el Journey, eliminación del falso login en Demo, y pruebas unitarias que validan la orquestación en ambos modos.

## Journey Reconstruction

1. **Ingreso a Pathfinder (`/`):** El usuario visualiza la selección de modo (Demo vs. Live) antes de iniciar el formulario de contexto o consultar disponibilidad.
2. **Selección Modo Demo:**
   - La aplicación establece `mode = 'demo'`.
   - No solicita Builder ID ni muestra el botón de login OAuth como requisito.
   - Deshabilita cualquier llamada de mutación hacia endpoints de AWS Events.
   - Las reservas y favoritos operan exclusivamente en memoria o estado local de demo.
3. **Selección Modo Live:**
   - La aplicación establece `mode = 'live'`.
   - Exige sesión válida de Builder ID para sincronizar la agenda y disponibilidad de AWS Events.
   - Muestra claramente el estado de autenticación (conectado con Builder ID vs. autenticación pendiente).
   - Los fallos de red se presentan como errores operativos de Live y no degradan silenciosamente a Demo.
4. **Conmutación de Modo:** El usuario puede cambiar de modo mediante una acción explícita que confirma el cambio y limpia el contexto para evitar contaminación cruzada.

## Problem

Actualmente, Pathfinder no gobierna sus modos mediante una política explícita:
- Un usuario en Demo puede presionar "Quick Demo Login", lo que genera un token simulado en `localStorage` (`demo-builder-id-token-...`). Esto rompe el límite de seguridad y confunde al cliente haciéndole creer que tiene una sesión real de AWS Builder ID.
- No existe una pantalla o selector inicial donde el usuario declare si está probando la herramienta localmente o si está en Las Vegas conectándose a su cuenta real de re:Invent.
- La ausencia de un contrato global dificulta que los futuros providers (WI-CANDIDATE-004) sepan si deben resolver datos desde fixtures o desde el API de AWS Events.

## Expected Value

Convierte la decisión inicial del usuario en una política global que gobierna autenticación, fuentes de datos, navegación y disponibilidad de acciones durante todo el Journey, garantizando que Demo y Live sean modos estrictamente aislados y verificables.

## Scope

1. **Contrato de Dominio:**
   - Añadir `ExperienceMode = 'demo' | 'live'` en `packages/domain/src/types/`.
   - Definir metadata de modo y estados de compatibilidad.

2. **Orquestación en Cliente (`apps/client`):**
   - Incorporar estado `mode: ExperienceMode` gestionado de manera predecible.
   - Crear componente selector inicial de modo (Demo / Live) con explicaciones claras de alcance y requisitos.
   - Mostrar indicador/badge visible en el header/navegación con el modo activo (`[🧪 Modo Demo]` vs `[🔴 Modo Live]`).
   - Eliminar el mecanismo de falso login (`handleQuickDemoLogin`) que inyectaba tokens simulados en `LocalStorageTokenStore`.
   - Asegurar que en Modo Demo, el usuario aparezca como "Modo Demostración (sin credenciales)" y no como autenticado con Builder ID.

3. **Pruebas y Verificación:**
   - Pruebas unitarias en `apps/client/src/client.test.ts` que validen la selección, la persistencia del modo y el comportamiento de las acciones en Demo y Live.

## Out of Scope

- Implementación de los adaptadores de datos desacoplados (`CatalogProvider`, etc.) — corresponde a WI-CANDIDATE-004.
- Rediseño integral de tokens y CSS de todas las pantallas — corresponde a WI-CANDIDATE-002.
- Modificación del backend de inferencia de Bedrock en AWS.

## Acceptance Criteria

- [x] El tipo `ExperienceMode = 'demo' | 'live'` está exportado y tipado en `@pathfinder/domain`.
- [x] La UI ofrece una selección inicial clara entre Modo Demo y Modo Live antes o al inicio del Journey.
- [x] El modo seleccionado es visible de manera persistente en la cabecera/interfaz durante toda la navegación.
- [x] En Modo Demo, no se generan tokens ficticios de Builder ID en `LocalStorageTokenStore` ni se finge autenticación OAuth.
- [x] En Modo Live, se requiere sesión real de Builder ID para las operaciones autenticadas de AWS Events.
- [x] El cambio voluntario de modo previene la contaminación cruzada de estados.
- [x] Todos los tests unitarios pasan en verde (`pnpm -r test`).

## Validation

- Ejecutar `tsc -b` y `pnpm -r test` para asegurar cero regresiones de tipos y pruebas.
- Validar interacciones en `client.test.ts` cubriendo la conmutación y persistencia de modos.

## Learning

- **Aislamiento de Modos sin Tokens Falsos:** Eliminar `handleQuickDemoLogin` erradica la vulnerabilidad de contaminar el almacenamiento persistente con tokens ficticios. El modo Demo opera con políticas que explícitamente saben que no requieren autenticación OAuth.
- **Transparencia en Modo Live:** Al exigir autenticación legítima de AWS Builder ID en modo Live, se asegura que las llamadas de mutación (favoritos, reservas) y la reconciliación de la agenda reflejen el estado verificado del asistente en re:Invent.
- **Tipado Estricto de Agendas en Ambos Modos:** La estructura de fallback para reservas y favoritos en modo Demo debe satisfacer el contrato completo de `UserScheduleResult` (`personalTime`, `lastSyncedAt`, `items`), asegurando que las vistas consumidoras y el reconciliador operen de manera idéntica sin fallos de tipo.
