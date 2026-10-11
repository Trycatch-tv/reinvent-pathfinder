---
type: initiative
id: INI-008
title: 'Experiencia unificada, orquestación de modos y trazabilidad de IA'
status: planned
knowledge_level: K2
domains:
  - product
  - experience
  - frontend
  - ai
  - architecture
related_capabilities:
  - experience-mode-management
  - journey-orchestration
  - design-system
  - session-availability
  - learning-path
  - adaptive-learning
  - ai-execution-traceability
created_at: '2026-10-11'
external_links:
  - 'https://github.com/Trycatch-tv/reinvent-pathfinder'
candidates:
  - id: WI-CANDIDATE-001
    title: 'Auditoría E2E de modos, fuentes de datos y participación de IA'
    type: spike
    suggested_knowledge_level: K3
    expected_value: >-
      Establece el mapa verificable de cómo se ejecuta cada etapa de Pathfinder,
      identificando fuentes reales, fixtures, inferencia, reglas
      determinísticas, fallbacks y mezclas inconsistentes.
    notes: >-
      Revisar App.tsx, handlers API, providers, reflexión adaptativa, Learning
      Report, autenticación, persistencia y Availability. Documentar evidencia
      antes de refactorizar.
    materialized_as: WI-031
  - id: WI-CANDIDATE-002
    title: 'Identidad visual unificada, Design System y App Shell'
    type: feature
    suggested_knowledge_level: K2
    expected_value: >-
      Unifica navegación, componentes, jerarquía visual, tipografía, colores y
      estados de interfaz para convertir las pantallas existentes en una
      experiencia coherente de Pathfinder.
    notes: >-
      Reutilizar React y Vite. Definir tokens y componentes compartidos antes de
      rediseñar las vistas. Conservar la identidad de producto y evitar
      introducir cambios funcionales innecesarios.
  - id: WI-CANDIDATE-003
    title: Selección inicial y orquestación global de Demo y Live
    type: feature
    suggested_knowledge_level: K3
    expected_value: >-
      Convierte la decisión inicial del usuario en una política global que
      gobierna autenticación, fuentes de datos, navegación y disponibilidad de
      acciones durante todo el Journey.
    notes: >-
      Demo y Live deben ser modos explícitos. El modo debe conservarse de forma
      segura durante navegación y recargas. Ningún token simulado debe
      representar una sesión real de Builder ID.
    materialized_as: WI-032
  - id: WI-CANDIDATE-004
    title: Providers aislados para ejecución Demo y Live
    type: refactor
    suggested_knowledge_level: K3
    expected_value: >-
      Elimina mezclas entre fixtures y servicios reales mediante contratos
      compartidos e implementaciones independientes, reutilizando domain,
      events-client y los servicios de IA.
    notes: >-
      Separar datos del catálogo, disponibilidad, agenda, favoritos, reservas,
      análisis y ranking. No sustituir silenciosamente resultados Live por
      fixtures cuando una llamada falle.
    materialized_as: WI-033
  - id: WI-CANDIDATE-005
    title: 'Carga automática de disponibilidad, catálogo y agenda'
    type: feature
    suggested_knowledge_level: K2
    expected_value: >-
      Elimina la necesidad de actualizar manualmente la disponibilidad al entrar
      y carga automáticamente los datos del modo seleccionado, con manejo de
      loading, errores y snapshots.
    notes: >-
      Evitar llamadas duplicadas, respetar throttling y conservar refresh manual
      como acción secundaria. Sin polling agresivo.
    materialized_as: WI-034
  - id: WI-CANDIDATE-006
    title: Consistencia del pipeline de IA y trazabilidad por etapa
    type: feature
    suggested_knowledge_level: K3
    expected_value: >-
      Permite verificar qué etapas utilizan Bedrock, cuáles usan heurísticas y
      cuáles son determinísticas, manteniendo el mismo contexto y las mismas
      sesiones durante todo el Journey.
    notes: >-
      Auditar analyze, rank, buildLearningPath, reflection y report. No atribuir
      inferencia a operaciones que no la realizan. Añadir metadata de ejecución
      sin exponer credenciales ni prompts sensibles.
    materialized_as: WI-035
  - id: WI-CANDIDATE-007
    title: 'Refinamiento de Learning Path, relevancia y agenda'
    type: feature
    suggested_knowledge_level: K2
    expected_value: >-
      Transforma la lista de recomendaciones en una ruta priorizada,
      diferenciando sesiones principales, alternativas y baja relevancia, con
      información operativa y justificación visible.
    notes: >-
      Mantener la reconciliación determinística con disponibilidad, agenda y
      conflictos. No eliminar recomendaciones útiles exclusivamente por un
      umbral arbitrario.
  - id: WI-CANDIDATE-008
    title: Rediseño de reflexión adaptativa y Learning Report
    type: feature
    suggested_knowledge_level: K3
    expected_value: >-
      Mejora la captura de aprendizaje y convierte el reporte final en una
      síntesis útil del progreso, sustentada en reflexiones, cobertura de gaps y
      recomendaciones posteriores.
    notes: >-
      Preservar el comparador determinístico existente. Considerar síntesis
      generativa como capacidad opcional y auditable, no como sustituto de los
      hechos del Journey.
  - id: WI-CANDIDATE-009
    title: 'Persistencia, aislamiento de sesiones y seguridad del estado'
    type: refactor
    suggested_knowledge_level: K3
    expected_value: >-
      Asegura que los Journeys, los datos Demo y Live, las sesiones Builder ID y
      los tokens no se contaminen ni persistan de manera insegura al cambiar de
      modo o recargar la aplicación.
    notes: >-
      Auditar LocalStorageTokenStore y pathfinder_journey_state. Revisar
      alternativas seguras para la sesión autenticada antes de cambiar su
      comportamiento. Evitar regresiones del OAuth.
  - id: WI-CANDIDATE-010
    title: 'Validación E2E, accesibilidad y consistencia de despliegues'
    type: chore
    suggested_knowledge_level: K3
    expected_value: >-
      Demuestra que todos los recorridos Demo y Live mantienen consistencia
      funcional, visual y de seguridad, tanto en desarrollo local como en el
      despliegue público soportado.
    notes: >-
      Incorporar pruebas de journey, regresión, responsive, accesibilidad y
      estados de error. Documentar explícitamente qué puede ejecutarse de forma
      real en cada entorno.
horizon: now
priority: high
---

# Experiencia unificada, orquestación de modos y trazabilidad de IA

## Goal

Transformar las funcionalidades existentes de re:Invent Pathfinder en una experiencia de producto coherente, visualmente consistente y técnicamente verificable.

El usuario debe poder elegir entre **Modo Demo** y **Modo Live** al iniciar la experiencia. Esa decisión debe determinar de forma consistente cómo se obtienen los datos, cómo se ejecutan las capacidades de IA, qué acciones están disponibles y cómo se mantiene su progreso.

La iniciativa también busca que las etapas del Journey compartan contexto y fuentes de datos, de manera que el diagnóstico, las recomendaciones, la ruta, las reflexiones y el reporte final formen un mismo ciclo de aprendizaje, sin mezclas accidentales entre datos simulados y reales.

## Problem

Pathfinder ha evolucionado mediante iniciativas que entregaron capacidades independientes: autenticación, AWS Events, disponibilidad, reservas, inferencia, recomendaciones, reflexión y reporte.

Aunque estas capacidades ya existen, la experiencia presenta oportunidades de mejora detectadas en la auditoría del código actual:

- Las vistas fueron construidas de forma incremental y todavía carecen de un sistema visual y shell unificado.
- El acceso Demo y el autenticado no están gobernados por una política de ejecución suficientemente explícita (`handleQuickDemoLogin` en `App.tsx` simula un token en `LocalStorageTokenStore`, simulando autenticación Builder ID).
- Algunos flujos consultan servicios reales y posteriormente recurren a fixtures o lógica heurística (`handleBuildLearningPath` consulta AWS Events pero ante error recurre a `DEMO_SESSIONS`, y `handleReflectionSubmit` hardcodea `DEMO_SESSIONS` y `SAMPLE_USER_SCHEDULE` en lugar del catálogo de la ruta activa).
- La disponibilidad requiere una acción manual inicial para obtener datos actualizados en `/availability`.
- La reflexión y la adaptación pueden utilizar un catálogo diferente (`DEMO_SESSIONS`) del empleado al generar el Learning Path.
- No todas las etapas comunican qué tipo de procesamiento generó sus resultados (analizadores heurísticos locales vs. invocación real de Amazon Bedrock Nova/Claude).
- Las recomendaciones de baja relevancia aparecen dentro de la misma ruta principal sin diferenciación de tier.
- El Learning Report refleja estados y cobertura porcentual determinística, pero tiene margen para comunicar mejor lo aprendido y los próximos pasos.
- La persistencia de estados (`pathfinder_journey_state`) y credenciales en `localStorage` requiere aislamiento estricto entre modos para evitar fugas y contaminación cruzada.

Esta iniciativa debe resolver estos problemas **sin reimplementar las capacidades ya entregadas**.

## Expected Value

Pathfinder debe pasar de ser un conjunto de funcionalidades conectadas a sentirse como un asistente coherente que acompaña al usuario durante todo re:Invent.

El resultado esperado es:

- Una experiencia comprensible desde el primer acceso con selector explícito de modo (Demo / Live).
- Identidad visual consistente con Design System y App Shell unificado.
- Flujo Demo completamente funcional y aislado (sin credenciales ni llamadas a AWS).
- Flujo Live basado en los servicios reales configurados (AWS Events + Bedrock).
- Disponibilidad y agenda cargadas automáticamente sin refresco manual forzado.
- Recomendaciones priorizadas (principales vs. alternativas vs. complementarias) y operativamente viables.
- Participación de IA verificable y trazable por etapa.
- Reflexiones adaptativas que preservan el catálogo del Journey activo.
- Reporte que refleja fielmente el aprendizaje documentado.
- Menor riesgo de regresiones cuando evolucionen los servicios de AWS.

## Scope

### 1. Auditoría funcional y técnica del Journey

Antes de refactorizar se debe establecer la ejecución real de las etapas:
`Context Capture` → `Knowledge Profile` → `Knowledge Gaps` → `Session Ranking` → `Learning Path` → `Reflection` → `Learning Report`.

También deben revisarse los flujos transversales:
`Authentication` → `Catalog` → `Availability` → `Schedule` → `Favorites` → `Reservations`.

Para cada etapa documentar:
- Input y output.
- Fuente de datos.
- Servicio o función ejecutada.
- Uso de inferencia Bedrock, heurísticas o reglas.
- Contexto y catálogo utilizados.
- Condiciones de fallback.
- Persistencia.
- Errores y riesgos de inconsistencia.
- Dependencias entre módulos.

El resultado será una matriz verificable de ejecución actual y objetivo. Esta auditoría precede las modificaciones del pipeline de IA.

### 2. Identidad visual y Design System

Construir un sistema visual propio de re:Invent Pathfinder, inspirado en su identidad actual, sin replicar innecesariamente las interfaces oficiales de AWS:
- Colores de marca y semánticos (navy, acentos naranja y azul, semáforo de disponibilidad).
- Tipografía, tamaños y jerarquía visual.
- Sistema de espaciado y contenedores compartidos.
- Botones, chips, filtros e inputs reutilizables.
- Estados de interfaz consistentes: loading, empty, success, error.
- Indicadores explícitos de modo (Demo vs. Live) y de ejecución de IA (Bedrock vs. Heurística vs. Reglas).
- Responsive layout y accesibilidad.

### 3. Unified App Shell

Crear una estructura de navegación compartida para:
- Home y selección de modo.
- Contexto (`ContextForm`).
- Knowledge Profile y Gaps (`KnowledgeProfileView`, `KnowledgeGapsList`).
- Learning Path (`LearningPathView`).
- Availability Heatmap (`AvailabilityHeatmap`).
- Reflexión (`ReflectionForm`).
- Learning Report (`LearningReportView`).
- About / Landing pública (`LandingView`).

El App Shell debe garantizar que la navegación no pierda el estado del Journey y mantenga la URL sincronizada con el estado de la aplicación.

### 4. Experience Mode Orchestration

Introducir el contrato de dominio:
```typescript
type ExperienceMode = 'demo' | 'live';
```
El modo debe seleccionarse explícitamente antes de comenzar y mantenerse durante toda la experiencia.

- **Demo:**
  - No requiere AWS Builder ID.
  - Utiliza catálogo y disponibilidad simulados (`sample-sessions.ts`, `availability-heatmap.ts`).
  - Agenda, favoritos y reservas simuladas en memoria o almacenamiento local aislado.
  - Análisis y ranking locales o respuestas simuladas claramente identificadas.
  - No ejecuta mutaciones contra AWS Events ni consume tokens reales.
  - El Journey completo debe poder demostrarse sin conectividad AWS.
- **Live:**
  - Requiere una sesión AWS Builder ID válida para las operaciones autenticadas de AWS Events.
  - Utiliza catálogo y disponibilidad de AWS Events (`AwsEventsClient`).
  - Consume la agenda personal confirmada por AWS Events.
  - Favoritos y reservas operan sobre el proveedor real.
  - Utiliza los servicios de IA de Bedrock configurados cuando están disponibles.
  - Los fallos de IA se manejan según la política de fallback definida y se comunican al usuario con trazabilidad.
  - No sustituye silenciosamente el catálogo o la agenda real por fixtures ante fallos de red.

### 5. Data Source Isolation

Introducir contratos reutilizables que permitan ejecutar el mismo Journey con distintas implementaciones:
- `CatalogProvider`
- `AvailabilityProvider`
- `ScheduleProvider`
- `ReservationProvider`
- `ContextAnalysisProvider`
- `RecommendationProvider`
- `JourneyAdaptationProvider`
- `LearningReportProvider`

Implementaciones:
- `DemoExperienceProvider`
- `LiveExperienceProvider`

**Invariante fundamental:** las sesiones, disponibilidad, agenda y recomendaciones utilizadas en una etapa deben corresponder exactamente al modo y al Journey activos.

### 6. Availability Auto-Bootstrap

Al ingresar a la vista de disponibilidad (`/availability`), la aplicación debe cargar automáticamente la información correspondiente sin requerir clics manuales iniciales:
- En Demo: carga fixtures y genera el snapshot de disponibilidad y agenda simulada inmediatamente.
- En Live autenticado: carga el catálogo, obtiene disponibilidad y recupera la agenda confirmada.
- En Live sin sesión: muestra un estado claro de autenticación requerida con acceso a Builder ID.
- El botón de refresco pasa a ser una acción secundaria. Preservación del último snapshot válido con timestamp ante errores.

### 7. AI Execution Consistency and Traceability

Auditar y formalizar la participación real de IA en:
1. Context Analysis (`HeuristicContextAnalyzer` vs `BedrockContextAnalyzer`).
2. Knowledge Profile (derivación de habilidades y dominios).
3. Knowledge Gaps (reglas vs inferencia generativa).
4. Session Ranking (`HeuristicSessionReranker` vs `BedrockSessionReranker`).
5. Learning Path Construction (`buildLearningPath` determinístico con reconciliación de agenda).
6. Reflection Adaptation (`adaptLearningPathFromReflection`).
7. Learning Report (`buildLearningReport` determinístico).

Distinguir explícitamente los orígenes de ejecución:
- `ai`: inferencia confirmada de Bedrock (Claude / Nova).
- `heuristic`: algoritmo local determinístico.
- `deterministic`: reglas de negocio puras.
- `hybrid`: combinación de inferencia y reglas.
- `fixture`: resultado simulado de demo.
- `fallback`: ruta alternativa ejecutada por fallo o política.

Registrar metadata de ejecución (proveedor, modelo, timestamp, latencia, razón de fallback) sin exponer credenciales ni prompts confidenciales.

### 8. Learning Path Experience

Refinar la presentación y priorización del Learning Path:
- **Ruta principal:** sesiones recomendadas de alta relevancia sin conflicto crítico de agenda.
- **Alternativas:** sesiones para cubrir las mismas brechas o resolver conflictos horarios/de sala.
- **Complementarias:** sesiones de relevancia secundaria.
- **Otras sesiones:** opciones con baja correlación con los gaps actuales.

Cada tarjeta debe explicitar: gaps cubiertos, relevancia relativa, justificación clara, horario, venue, disponibilidad, estado de reserva/favorito y viabilidad operativa.

### 9. Reflection and Learning Report

Refinar la experiencia de reflexión post-sesión y síntesis final:
- Capturar utilidad percibida, aprendizaje principal, relación con los gaps y observaciones clave.
- Garantizar que la adaptación utilice el catálogo y contexto correspondientes al Journey activo (no forzar `DEMO_SESSIONS` en modo Live).
- Estructurar el Learning Report con estado inicial vs final de brechas, sesiones de impacto, aprendizajes documentados y ruta post-evento sugerida.
- La síntesis generativa con Bedrock puede ser una capacidad opcional y auditable en Live, manteniendo la base cuantitativa determinística.

### 10. Persistencia y seguridad

Asegurar la recuperación del Journey y el aislamiento estricto:
- Aislamiento total de `pathfinder_journey_state` entre modos Demo y Live.
- Ciclo de vida claro de tokens en `TokenStore` (evitar tokens falsos simulando sesiones autenticadas).
- Limpieza integral de credenciales y caché durante logout y cambio de modo.
- Protección de tokens y sesiones frente a logging, llamadas de telemetría y componentes de UI.

### 11. Validación y experiencia de despliegue

Verificación multidimensional en:
- Desarrollo local (Vite dev server con proxies y mock schedules).
- Despliegue de producción (Netlify / hosting estático).
- Modo Demo sin credenciales ni conectividad cloud.
- Modo Live con Builder ID y AWS Events API.
- Manejo de sesiones expiradas, throttling (429) y caídas de servicio.
- Responsividad móvil y accesibilidad (WCAG AA).

## Out of Scope

- Crear nuevos agentes o rediseñar la infraestructura cloud de Bedrock / AgentCore.
- Sustituir Amazon Bedrock Managed Knowledge Bases.
- Modificar los contratos oficiales del API de AWS Events.
- Implementar un mecanismo de reservas alternativo fuera de AWS Events.
- Migrar el Journey a DynamoDB o introducir persistencia centralizada en base de datos.
- Desarrollar una app móvil nativa o navegación indoor por mapas de Las Vegas.
- Cambiar el framework base de React + Vite a otra tecnología.
- Funcionalidades de red social o interacción entre múltiples asistentes.

## Architecture Boundaries

**INI-008 debe reutilizar las capacidades existentes.**

- Las modificaciones se concentrarán en `apps/client`, contratos de dominio en `packages/domain`, contratos de API en `packages/contracts`, composición de providers y adapters puntuales.
- La UI no debe decidir directamente mediante condiciones dispersas si usar fixtures o AWS; la orquestación de modos resuelve la inyección de providers.
- Las operaciones sobre AWS Events no deben tratarse como inferencia de IA.
- Los modelos generativos no deben inventar reservas, cupos ni estados de agenda.

## Success Criteria

- Existe una identidad visual coherente y App Shell compartido en todas las pantallas.
- El usuario selecciona explícitamente entre Modo Demo y Modo Live al iniciar.
- El modo seleccionado gobierna el recorrido completo sin contaminación de estados.
- El Modo Demo funciona al 100% sin Builder ID, backend de Bedrock ni llamadas reales a AWS Events.
- El Modo Live utiliza datos reales de AWS Events y Bedrock sin sustituir silenciosamente con fixtures ante errores.
- Las sesiones y el contexto en ranking, Learning Path y reflexión permanecen estrictamente consistentes.
- La pantalla de Availability carga automáticamente los datos al entrar.
- La agenda personal y disponibilidad se sincronizan de forma no bloqueante.
- La UI expone con claridad qué resultados provienen de IA, heurística, reglas o fixtures simulados.
- El Learning Path separa las recomendaciones prioritarias de las alternativas y complementarias.
- La reflexión adaptativa actualiza correctamente las brechas y el Learning Path usando el catálogo del Journey activo.
- El Learning Report refleja fielmente el progreso documentado y propone la ruta posterior.
- La persistencia local y el logout aíslan los datos de sesión y credenciales.
- Los flujos de favoritos y reservas continúan operando y reconciliando en tiempo real.
- Existen pruebas unitarias y de integración para ambos modos.
- Las vistas principales son completamente funcionales en desktop y dispositivos móviles.
- No existen errores de consola bloqueantes en los flujos principales.
- Todos los comandos de calidad del monorepo (`pnpm -r test`, `tsc -b`, `eslint .`) permanecen en verde.
- La documentación y grafos de Kaddo reflejan fielmente las decisiones de arquitectura.


## Dependencies

### Required

- **INI-001 — Fundación técnica del monorepo** (packages/domain, tooling, CI).
- **INI-002 — Integración con AWS Events** (packages/events-client, OAuth PKCE, schedule).
- **INI-003 — Motor de conocimiento y recomendaciones** (ai/knowledge, candidate-filter, reranker).
- **INI-004 — Learning Path y reflexión** (buildLearningPath, adaptLearningPathFromReflection).
- **INI-005 — Cierre de ciclo y exposición** (Learning Report, LandingView /about).
- **INI-006 — IA real en AWS** (BedrockContextAnalyzer, BedrockSessionReranker, CostGuardrail, AiMetricsTracker).
- **INI-007 — Live Event Experience** (disponibilidad en vivo, heatmap, reservas, favoritos).

### Principal surfaces

- `apps/client/src/App.tsx`
- `apps/client/src/components/`
- `apps/client/src/auth/`
- `apps/client/src/fixtures/`
- `packages/domain/`
- `packages/events-client/`
- `ai/knowledge/`
- `services/api/` (únicamente si se requieren extensiones de contratos de trazabilidad)
- `knowledge/product/`
- `knowledge/tech/`
- `knowledge/delivery/`

## Suggested Execution Order

**Foundation and consistency**
1. **WI-CANDIDATE-001** — Auditoría E2E de modos, fuentes de datos y participación de IA.
2. **WI-CANDIDATE-003** — Selección inicial y orquestación global de Demo y Live.
3. **WI-CANDIDATE-004** — Providers aislados para ejecución Demo y Live.
4. **WI-CANDIDATE-009** — Persistencia, aislamiento de sesiones y seguridad del estado.

**Experience and UI (puede avanzar en paralelo)**
5. **WI-CANDIDATE-002** — Identidad visual unificada, Design System y App Shell.
6. **WI-CANDIDATE-005** — Carga automática de disponibilidad, catálogo y agenda.
7. **WI-CANDIDATE-007** — Refinamiento de Learning Path, relevancia y agenda.

**Intelligence and learning**
8. **WI-CANDIDATE-006** — Consistencia del pipeline de IA y trazabilidad por etapa.
9. **WI-CANDIDATE-008** — Rediseño de reflexión adaptativa y Learning Report.

**Closure**
10. **WI-CANDIDATE-010** — Validación E2E, accesibilidad y consistencia de despliegues.

## Work Item Candidates

1. **WI-CANDIDATE-001** — Auditoría E2E de modos, fuentes de datos y participación de IA (Spike).
2. **WI-CANDIDATE-002** — Identidad visual unificada, Design System y App Shell (Feature).
3. **WI-CANDIDATE-003** — Selección inicial y orquestación global de Demo y Live (Feature).
4. **WI-CANDIDATE-004** — Providers aislados para ejecución Demo y Live (Refactor).
5. **WI-CANDIDATE-005** — Carga automática de disponibilidad, catálogo y agenda (Feature).
6. **WI-CANDIDATE-006** — Consistencia del pipeline de IA y trazabilidad por etapa (Feature).
7. **WI-CANDIDATE-007** — Refinamiento de Learning Path, relevancia y agenda (Feature).
8. **WI-CANDIDATE-008** — Rediseño de reflexión adaptativa y Learning Report (Feature).
9. **WI-CANDIDATE-009** — Persistencia, aislamiento de sesiones y seguridad del estado (Refactor).
10. **WI-CANDIDATE-010** — Validación E2E, accesibilidad y consistencia de despliegues (Chore).

## Open Questions

- [open] ¿El despliegue público actual en Netlify admite completamente el callback OAuth real de AWS Events y llamadas con CORS a endpoints productivos?
- [open] ¿Cuál es el mecanismo recomendado para preservar la sesión de AWS Builder ID en el navegador sin exponer credenciales de larga duración en `localStorage` no cifrado?
- [open] ¿Cuál es la política de fallback de IA en modo Live: degradación automática transparente con indicador visual, o advertencia requiriendo confirmación del usuario?
- [open] ¿Qué metadata de ejecución exponen actualmente los endpoints de `/api/analyze` y `/api/recommendations/rank` hacia el frontend?
- [open] ¿Qué criterios de corte dividen las recomendaciones principales de las alternativas y complementarias en el Learning Path?
- [open] ¿La síntesis narrativa del Learning Report debe incorporar una llamada opcional a Bedrock en esta iniciativa o permanecer 100% determinística?
- [open] ¿Qué información del Journey es seguro compartir entre recargas en modo Demo vs modo Live?
- [open] ¿Qué pruebas live pueden automatizarse sin mutar el cupo real de reservas de un usuario registrado?

## Delivery and Validation Rules

- No duplicar capacidades existentes ni reemplazar dependencias sin justificación arquitectónica.
- Mantener en verde todos los tests y types existentes en cada paso.
- Las tareas de UX/UI requieren verificación visual en entornos de escritorio y móviles.
- Antes de consolidar cambios visuales, presentar la interfaz al usuario y solicitar confirmación.
- Documentar las evidencias y aprendizajes en el Knowledge Base de Kaddo.
- Cada Work Item candidate debe materializarse y refinarse individualmente antes de implementarse.

## Learning

_Captured on completion: mejoras del Journey, consistencia alcanzada entre Demo y Live, decisiones de seguridad, calidad de IA y resultados de validación E2E._
