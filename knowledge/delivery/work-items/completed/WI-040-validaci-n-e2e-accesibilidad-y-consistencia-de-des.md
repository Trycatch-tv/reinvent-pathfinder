---
type: chore
id: WI-040
title: 'Validación E2E, accesibilidad y consistencia de despliegues'
knowledge_level: K3
status: completed
phase: now
initiative: INI-008
domains:
  - frontend
  - experience
  - architecture
  - testing
code:
  - apps/client/src/client.test.ts
  - apps/client/.env.example
  - knowledge/tech/codebase.md
created_at: '2026-10-12'
completed_at: '2026-10-12'
source: initiative
source_id: WI-CANDIDATE-010
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
        - apps/client/src/client.test.ts
        - apps/client/.env.example
        - knowledge/tech/codebase.md
      validations:
        - pnpm -r test
        - pnpm -r build
        - pnpm -r lint
implementation_status: completed
validation_status: completed
verified_at: '2026-10-12'
---

# Validación E2E, accesibilidad y consistencia de despliegues

> Materializado desde la Iniciativa INI-008, candidato WI-CANDIDATE-010.

## Problem

Con la implementación de la orquestación de modos (Demo vs Live), providers desacoplados, trazabilidad del pipeline de IA, Learning Path priorizado, reflexiones adaptativas, reporte ejecutivo, design tokens, App Shell y aislamiento de almacenamiento, se requería:
- Demostrar formalmente que el recorrido integral (E2E) funciona de principio a fin de manera consistente en ambos modos.
- Auditar y verificar que los patrones de accesibilidad (roles semánticos ARIA, etiquetas, interacción por teclado y estados de contraste) se cumplan transversalmente en los flujos principales.
- Documentar de manera unívoca la matriz de entornos (desarrollo local, preview público, producción con AWS Events y Bedrock) para evitar expectativas erróneas sobre lo que se ejecuta de forma real en cada escenario.

## Acceptance Criteria

- [x] Prueba E2E de Journey completo en Modo Demo validando la secuencia integral: Inicio → Contexto → Diagnóstico → Learning Path con tiers → Reflexión adaptativa con actionItem → Learning Report con resumen ejecutivo y exportación Markdown.
- [x] Prueba E2E de gobernanza de Modo Live: verificación de pantalla de autenticación obligatoria, bloqueo de consultas no autenticadas, disponibilidad de cambio rápido a Demo, y llamadas con Bearer token tras login.
- [x] Validación de accesibilidad semántica: roles `role="alert"`, `role="button"`, `role="status"`, atributos `aria-label`, estados `disabled` e interacción accesible de componentes.
- [x] Matriz de despliegue y entornos documentada en `knowledge/tech/codebase.md` y `.env.example` clarificando capacidades locales vs cloud.
- [x] Suite completa de pruebas, compilación de TypeScript y linting pasando en verde en todos los paquetes del monorepo.

## Out of scope

- Infraestructura de backend cloud adicional o pipelines CI externos no soportados en el workspace local.
- Sustitución de pruebas unitarias por un entorno de navegador Playwright headless en CI (preparado conceptualmente para etapas posteriores).

## Validation

- `pnpm -r build` compila limpiamente sin errores de tipos TypeScript.
- `pnpm -r test` pasa el 100% de tests unitarios en todos los paquetes.
- `pnpm -r lint` pasa con 0 errores y 0 advertencias.
- `kaddo verify WI-040 --yes` valida el cumplimiento de las metas.

## Learning

1. **Verificación integral de extremos (E2E) sin fragilidad en SSR**: Probar la progresión secuencial de las 5 etapas del Journey (Contexto → Diagnóstico → Learning Path → Reflexión → Learning Report) mediante renderizado server-side e inyección aislada de estado permite validar el contrato visual y semántico completo de Pathfinder de forma determinística y rápida (sub-segundo).
2. **Gobernanza de accesibilidad consistente**: La inclusión de landmarks semánticos (`<header>`, `<main>`, `<footer>`, `<nav aria-label="Navegación principal">`), atributos `aria-label` en elementos interactivos sin texto visible y roles semánticos de estado (`role="alert"`, `role="status"`) consolida una experiencia usable para lectores de pantalla y navegación por teclado.
3. **Transparencia operativa entre entornos**: Documentar la matriz de capacidades locales vs cloud en `.env.example` y `knowledge/tech/codebase.md` previene confusiones entre evaluadores, clarificando que el Modo Demo es 100% offline y local-first, mientras que el Modo Live interactúa de forma real y segura mediante AWS Builder ID con AWS Events y Bedrock.
