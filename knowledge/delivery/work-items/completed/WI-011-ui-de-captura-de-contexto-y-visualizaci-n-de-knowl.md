---
type: feature
id: WI-011
title: UI de captura de contexto y visualización de Knowledge Profile / Gaps
knowledge_level: K2
status: completed
phase: now
completed_at: '2026-10-05'
initiative: INI-004
domains:
  - experience
  - product
code:
  - apps/client/**
created_at: '2026-10-05'
source: initiative
source_id: WI-CANDIDATE-001
source_initiative: INI-004
affected_modules:
  - reinvent-pathfinder
ready_at: '2026-10-05'
implementation_evidence:
  repositories:
    core:
      role: core
      status: completed
      changed_paths:
        - apps/client/index.html
        - apps/client/vite.config.ts
        - apps/client/src/App.tsx
        - apps/client/src/components/ContextForm.tsx
        - apps/client/src/components/KnowledgeProfileView.tsx
        - apps/client/src/components/KnowledgeGapsList.tsx
        - apps/client/src/client.test.ts
      validations:
        - command: 'tsc -b'
          status: passed
          reason: 'Typecheck sin errores (reconciliado en WI-012).'
        - command: 'vitest run (apps/client)'
          status: passed
          reason: 'apps/client: 2 archivos de test passing.'
implementation_status: completed
validation_status: completed
verified_at: '2026-10-06'
reconciled_by: WI-012
---

# UI de captura de contexto y visualización de Knowledge Profile / Gaps

> Materialized from Initiative INI-004, candidate WI-CANDIDATE-001.

## Outcome

- **Actor:** Asistente a AWS re:Invent que ingresa a Pathfinder para alinear su aprendizaje con su proyecto real.
- **Current behavior:** No existe interfaz gráfica en `apps/client`; los contratos de contexto (`@pathfinder/contracts`), el analizador heurístico/Bedrock (`@pathfinder/ai-knowledge`) y los agentes (`@pathfinder/ai-agents`) solo pueden ejecutarse por código o scripts.
- **Target behavior:** `apps/client` ofrece una aplicación web local-first interactiva en React + Vite + TypeScript que implementa el **Journey 1 de producto**:
  1. **Captura de contexto:** Formulario con "¿Qué estás construyendo?", stack actual (tags interactivos), nivel de seniority (`beginner`, `intermediate`, `advanced`) y objetivos de aprendizaje.
  2. **Análisis de contexto:** Invocación local directa / reactiva al analizador (`HeuristicContextAnalyzer` / `ContextAnalysisTool`) sin necesidad de desplegar infraestructura ni pagar costos de AWS.
  3. **Visualización y edición de Knowledge Profile:** Panel interactivo que presenta dominios detectados, habilidades del asistente y nivel de suficiencia.
  4. **Visualización y ajuste de Knowledge Gaps:** Lista de brechas detectadas con severidad (`critical`, `important`, `nice-to-have`), justificación y capacidad de agregar o editar gaps antes de generar recomendaciones.
- **Observable completion:** Componentes React en `apps/client/src/components/`, interfaz principal en `apps/client/src/App.tsx`, pruebas unitarias en Vitest con Testing Library y 100% de tests y verificaciones aprobados.

## Journey reconstruction

```text
Entrada:
  • Asistente abre Pathfinder en el navegador (local-first)
       ↓
1. Pantalla de Contexto:
   - Responde "¿Qué estás construyendo?"
   - Selecciona o escribe tecnologías de su stack (ej: DynamoDB, Bedrock, Serverless)
   - Selecciona su seniority (Principiante / Intermedio / Avanzado)
   - Define metas de la conferencia
       ↓
2. Botón "Analizar Contexto":
   - Ejecuta ContextAnalyzer en memoria
   - Genera ProjectContext, KnowledgeProfile y KnowledgeGaps
       ↓
3. Pantalla de Perfil & Gaps:
   - Visualiza resumen de habilidades identificadas
   - Visualiza Knowledge Gaps clasificados por severidad
   - Puede editar gaps o añadir nuevos manualmente
       ↓
Salida: Contexto y gaps listos para alimentar la generación del Learning Path (WI-012)
```

## Problem

Sin una experiencia visual accesible y sin fricción de login o despliegues complejos, el participante no puede interactuar con el motor cognitivo de Pathfinder. Se requiere una interfaz moderna, limpia y local-first que materialice el Journey 1 del producto.

_Expected value:_ Experiencia local-first para capturar contexto y revisar/editar perfil y gaps.

## Scope

- Configurar dependencias de React, ReactDOM, Vite y testing en `apps/client/package.json`.
- Implementar componentes modulares:
  - `ContextForm`: captura de nombre de proyecto, descripción, seniority, stack y objetivos.
  - `KnowledgeProfileView`: visualización clara de skills, proficiencies y dominios clave.
  - `KnowledgeGapsList`: visualización de brechas con badges de severidad, rationale y acción para añadir/modificar brechas.
- Implementar estado de la aplicación en `App.tsx` que orqueste la transición entre captura y visualización.
- Pruebas unitarias completas con Vitest para los componentes de la interfaz.

## Out of scope

- Visualización del Learning Path y reconciliación de agenda (`WI-012`).
- Reflexión post-sesión (`WI-013`).
- Despliegue en AWS S3 / CloudFront (`INI-005`).

## Surface review

- **Product/UI:** affected — interfaz gráfica de usuario en `apps/client`.
- **Frontend:** affected — React 19 / TypeScript / Vite.
- **Backend:** reviewed-not-affected — consume `@pathfinder/contracts` y lógica cliente/local.
- **AI/Agentic:** reviewed-not-affected — utiliza `@pathfinder/ai-knowledge`.
- **Shared packages:** reviewed — consume `@pathfinder/domain` y `@pathfinder/contracts`.
- **Operations/release:** reviewed.

## Acceptance Criteria

- [x] `ContextForm` permite ingresar proyecto, descripción, seleccionar seniority y especificar stack y objetivos.
- [x] El sistema genera un `KnowledgeProfile` y `KnowledgeGaps` válidos mediante el analizador de contexto.
- [x] `KnowledgeProfileView` renderiza los dominios técnicos y habilidades identificadas.
- [x] `KnowledgeGapsList` muestra brechas clasificadas por severidad con su justificación y permite alternar o añadir nuevas.
- [x] Suite de pruebas con Vitest para los componentes de la UI con 100% de tests aprobados.
- [x] **End-to-end:** `pnpm lint; pnpm typecheck; pnpm test` finalizan con código de salida 0 en todo el monorepo.

## Validation

- Ejecutar `pnpm typecheck` validando tipado entre `apps/client`, `@pathfinder/domain` y `@pathfinder/contracts`.
- Ejecutar `pnpm test` verificando renderizado de componentes y transiciones de estado.
- Ejecutar `pnpm lint` confirmando 0 errores.

## Learning

- La experiencia local-first de React 19 en `apps/client` aprovecha directamente los paquetes desacoplados `@pathfinder/domain` y `@pathfinder/ai-knowledge`, permitiendo al asistente autoevaluar su contexto y editar brechas sin latencia ni dependencia de infraestructura remota en la fase de captura.
- Separar visualmente el `Knowledge Profile` (habilidades/dominios) de la lista editable de `Knowledge Gaps` (con badges de severidad e interactividad para añadir/eliminar) proporciona al asistente control transparente sobre las señales que gobernarán sus recomendaciones en re:Invent.
