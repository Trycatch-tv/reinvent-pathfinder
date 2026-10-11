---
type: discovery
id: e2e-modes-data-ai-audit
title: 'Auditoría E2E: Modos de ejecución, fuentes de datos y participación de IA'
created_at: '2026-10-11'
initiative: INI-008
work_item: WI-031
domains:
  - product
  - experience
  - frontend
  - ai
  - architecture
status: completed
---

# Auditoría E2E: Modos de ejecución, fuentes de datos y participación de IA en re:Invent Pathfinder

> Resultado del Spike **WI-031** (Iniciativa INI-008).
> Fuente de verdad técnica basada en inspección estática del código del monorepo (`apps/client`, `packages/events-client`, `ai/knowledge`, `services/api`).

---

## 1. Resumen Ejecutivo

Pathfinder cuenta con todas las piezas funcionales necesarias para un ciclo adaptativo de aprendizaje y gestión de eventos re:Invent. Sin embargo, su construcción incremental generó:
1. **Mezclas de catálogos silenciosas:** Etapas avanzadas (ej. `adaptLearningPathFromReflection`) hardcodean `DEMO_SESSIONS` y `SAMPLE_USER_SCHEDULE`, rompiendo la continuidad cuando el usuario opera sobre sesiones reales de AWS Events.
2. **Ambigüedad en la participación de IA:** El usuario no puede saber si un resultado provino de inferencia real de Amazon Bedrock (Nova Micro / Claude 3.5) o de fallbacks heurísticos locales por expresiones regulares.
3. **Contaminación de estados Demo vs. Live:** El mecanismo "Quick Demo Login" inyecta tokens simulados en `LocalStorageTokenStore`, y la persistencia de `pathfinder_journey_state` no separa los estados Demo de los Live.
4. **Falta de auto-bootstrap:** Las vistas como `/availability` requieren interacción manual repetida para poblar datos iniciales.

---

## 2. Matriz E2E de Ejecución por Etapa del Learning Journey

| Etapa | Archivos Fuente Clave | Input / Output | Fuente de Datos Actual | Modo de Procesamiento Real | Fallback Actual | Riesgo / Inconsistencia Detectada |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1. Context Capture** | `ContextForm.tsx` | Formulario usuario → `AnalyzeContextRequest` | Entrada directa de usuario | **Determinístico UI** (React) | N/A | Ninguno. Soporta stacks predefinidos y personalizados interactivos. |
| **2. Knowledge Profile & Gaps** | `context-analyzer.ts`, `services/api/.../context-analyze.ts`, `App.tsx:295` | `AnalyzeContextRequest` → `AnalyzeContextResponse` (Profile + Gaps) | Base de conocimiento Kaddo / Input usuario | **Híbrido:** Bedrock Converse (`Nova Micro` / `Claude`) si `USE_BEDROCK=true`; de lo contrario `HeuristicContextAnalyzer` | Cae a `HeuristicContextAnalyzer` en navegador ante error de red | No se expone al usuario si el análisis fue generado por Bedrock o por heurística local. |
| **3. Session Ranking** | `session-reranker.ts`, `services/api/.../recommendations-rank.ts`, `App.tsx:343` | Gaps + Sesiones candidatas → `SessionRecommendation[]` | Catálogo de eventos (Live o Fixture) | **Híbrido:** Bedrock Converse si `USE_BEDROCK=true`; de lo contrario `HeuristicSessionReranker` | Cae a `HeuristicSessionReranker` en navegador | Si falla el snapshot live, recurre silenciosamente a `DEMO_SESSIONS`. No hay tiers de relevancia en la UI. |
| **4. Learning Path Construction** | `learning-path-builder.ts`, `App.tsx:367` | Recomendaciones + Agenda → `LearningPath` | Recomendaciones rankeadas + `SAMPLE_USER_SCHEDULE` | **100% Determinístico local** (Reconciliador de conflictos sin red) | N/A | **Inconsistencia:** Hardcodea `SAMPLE_USER_SCHEDULE` en lugar de la agenda confirmada del usuario. |
| **5. Session Availability & Heatmap** | `AvailabilityHeatmap.tsx`, `aws-events-client.ts`, `App.tsx:81` | Filtros día/venue → Matriz de disponibilidad | AWS Events REST API (`ListSessions`) o `SAMPLE_HEATMAP_AVAILABILITY` | **Integración Live / Fixture determinístico** | Cae a fixture si `liveSnapshot` es nulo | Requiere clic manual para actualizar datos al entrar; no hay auto-bootstrap. |
| **6. Reflection Adaptation** | `reflection-adapter.ts`, `App.tsx:400` | `Reflection` + Gaps → `updatedGaps`, `LearningPath` | `DEMO_SESSIONS` + `SAMPLE_USER_SCHEDULE` (fijos en código) | **100% Heurístico local** (`HeuristicSessionReranker`) | N/A | **CRÍTICO:** Ignora el catálogo y agenda del Journey activo; siempre usa `DEMO_SESSIONS`, perdiendo sesiones live. |
| **7. Learning Report** | `learning-report-builder.ts`, `LearningReportView.tsx`, `App.tsx:394` | `initialGaps` vs `currentGaps` → `LearningReport` | Snapshots de gaps en memoria / localStorage | **100% Determinístico local** (Cálculo de cobertura y ordenamiento) | N/A | Solo métricas cuantitativas; no ofrece síntesis narrativa cualitativa. |

---

## 3. Matriz de Flujos Transversales

| Flujo Transversal | Implementación Actual | Modo Demo | Modo Live | Riesgo / Brecha |
| :--- | :--- | :--- | :--- | :--- |
| **Autenticación** | `builder-id-client.ts`, `BuilderIdLogin.tsx`, `token-store.ts` | "Quick Demo Login" escribe `demo-builder-id-token-...` en `LocalStorageTokenStore` | OAuth 2.0 PKCE contra `auth.awsevents.com` con callback `/callback` | Demo finge estar autenticado con Builder ID; tokens no deben persistirse de forma insegura. |
| **Catálogo de Sesiones** | `sample-sessions.ts` (12 sesiones) vs AWS Events API | 12 sesiones normalizadas | `liveEventsClient.fetchAvailabilitySnapshot()` | Si la llamada live falla, se sustituye por `DEMO_SESSIONS` sin notificación explícita de degradación. |
| **Agenda Personal** | `user-schedule.ts`, `sample-user-schedule.ts` | `SAMPLE_USER_SCHEDULE` en memoria | `liveEventsClient.getPersonalSchedule()` | `buildLearningPath` y `reflection-adapter` no consumen la agenda live obtenida. |
| **Favoritos** | `LearningPathView.tsx`, `AvailabilityHeatmap.tsx` | Actualiza estado local / mock schedule | `liveEventsClient.addFavoriteSession()` / `removeFavoriteSession()` | Funciona bien pero no distingue si el usuario está en demo pura sin sesión. |
| **Reservas** | `LearningPathView.tsx`, `AvailabilityHeatmap.tsx` | Reconciliación en mock schedule | `liveEventsClient.reserveSessions()` / `cancelReservation()` | Se reconcilia contra la respuesta de AWS Events; en demo simula confirmación. |
| **Persistencia** | `localStorage` (`pathfinder_journey_state`) | Guarda gaps, path, recomendaciones | Guarda gaps, path, recomendaciones | No hay namespace ni separación de clave entre Demo y Live; recargar contamina el estado. |

---

## 4. Clasificación Estricta del Procesamiento de IA

Para eliminar la ambigüedad en la UI, el sistema debe formalizar el origen de ejecución mediante el tipo:

```typescript
export type ExecutionProvenance =
  | 'ai'            // Inferencia confirmada de Amazon Bedrock (Nova Micro / Claude 3.5)
  | 'heuristic'     // Algoritmo local determinístico de scoring/coincidencias
  | 'deterministic' // Reglas puras de negocio (reconciliación de agenda, cálculo de gaps)
  | 'hybrid'        // Combinación explícita (ej. ranking Bedrock reconciliado con reglas)
  | 'fixture'       // Datos simulados de catálogo y agenda de demostración
  | 'fallback';     // Ruta alternativa activada ante fallo o ausencia de credenciales
```

### Mapa Real de Capacidades:
- **`ai` real:** Disponible **únicamente** en `BedrockContextAnalyzer` (`context-analyzer.ts`) y `BedrockSessionReranker` (`session-reranker.ts`) cuando `USE_BEDROCK=true` o credenciales AWS están activas.
- **`heuristic`:** `HeuristicContextAnalyzer` y `HeuristicSessionReranker` (búsqueda de subcadenas y matrices fijas de pesos).
- **`deterministic`:** `buildLearningPath`, `applyReflectionToGaps`, `evaluateScheduleConflicts`, `buildLearningReport`.
- **`fixture`:** `DEMO_SESSIONS`, `SAMPLE_USER_SCHEDULE`, `SAMPLE_HEATMAP_AVAILABILITY`.

---

## 5. Decisiones Arquitectónicas Derivadas para los Siguientes Work Items

1. **WI-CANDIDATE-003 (Orquestación de Modos):**
   - Definir `ExperienceMode = 'demo' | 'live'`.
   - La pantalla inicial debe requerir selección explícita del modo.
   - En Modo Demo, **no se permite ni se simula Builder ID**; todas las operaciones de agenda/favoritos/reservas operan sobre un almacén de memoria demo.
   - En Modo Live, se exige sesión Builder ID para operaciones de AWS Events y credenciales AWS para Bedrock. Si Bedrock falla, la degradación debe ser visible y registrada como `fallback`.

2. **WI-CANDIDATE-004 (Providers Aislados):**
   - Crear interfaces estables:
     - `CatalogProvider`
     - `AvailabilityProvider`
     - `ScheduleProvider`
     - `ReservationProvider`
     - `ContextAnalysisProvider`
     - `RecommendationProvider`
     - `JourneyAdaptationProvider`
     - `LearningReportProvider`
   - Implementar `DemoExperienceProvider` y `LiveExperienceProvider` desacoplados de `App.tsx`.
   - **Invariante:** Las sesiones candidatas y la agenda inyectadas en `buildLearningPath` y `adaptLearningPathFromReflection` provienen **siempre del provider del modo activo**, nunca de constantes hardcodeadas.

3. **WI-CANDIDATE-005 (Availability Auto-Bootstrap):**
   - Al montar `/availability`, ejecutar inmediatamente la carga según el modo activo.
   - En Demo: carga fixtures instantáneamente.
   - En Live: verifica sesión Builder ID, invoca `fetchAvailabilitySnapshot()` y `getPersonalSchedule()`.
   - Eliminar la necesidad de clics manuales iniciales; el botón refresh pasa a ser una acción secundaria.

4. **WI-CANDIDATE-006 (Consistencia y Trazabilidad de IA):**
   - Extender los contratos de respuesta con `ExecutionMetadata`:
     ```typescript
     export interface ExecutionMetadata {
       readonly provenance: ExecutionProvenance;
       readonly modelId?: string;
       readonly latencyMs?: number;
       readonly timestamp: string;
       readonly fallbackReason?: string;
     }
     ```
   - Exponer un badge sutil en la UI (`[⚡ Bedrock Nova]` vs `[📐 Reglas Heurísticas]` vs `[🧪 Datos Demo]`).

5. **WI-CANDIDATE-007 (Learning Path UX Tiers):**
   - Categorizar visualmente las recomendaciones en:
     - *Ruta Principal (Tier 1)*: Score alto sin conflicto duro de horario.
     - *Alternativas (Tier 2)*: Sesiones con temas similares para resolver conflictos o sobrecupo.
     - *Complementarias (Tier 3)*: Sesiones relacionadas con gaps secundarios.
     - *Otras Opciones*: Baja afinidad.

6. **WI-CANDIDATE-009 (Aislamiento y Seguridad):**
   - Separar claves de persistencia: `pathfinder_journey_state_demo` vs `pathfinder_journey_state_live`.
   - Limpiar tokens de Builder ID al cerrar sesión o conmutar de modo.
   - Evitar almacenar tokens falsos en `LocalStorageTokenStore`.
