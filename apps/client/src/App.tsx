import {
  HeuristicContextAnalyzer,
  HeuristicSessionReranker,
  adaptLearningPathFromReflection,
  buildLearningPath,
  buildLearningReport,
  type LearningReport,
} from "@pathfinder/ai-knowledge"
import type {
  AnalyzeContextRequest,
  AnalyzeContextResponse,
  RankRecommendationsRequest,
  RankRecommendationsResponse,
} from "@pathfinder/contracts"
import type {
  ExecutionStage,
  ExperienceMode,
  KnowledgeGap,
  LearningPath,
  Reflection,
  SessionCandidate,
  SessionRecommendation,
  StageExecutionTrace,
} from "@pathfinder/domain"
import {
  AwsBuilderIdAuthClient,
  AwsEventsClient,
  AwsEventsError,
  AwsEventsForbiddenError,
  AwsEventsNotFoundError,
  AwsEventsThrottlingError,
  AwsEventsUnauthorizedError,
  SessionStorageTokenStore,
  SAMPLE_RAW_SESSIONS,
  type UserScheduleResult,
  normalizeAwsSession,
} from "@pathfinder/events-client"
import React, { useEffect, useMemo, useRef, useState } from "react"
import { Lock } from "lucide-react"
import { AITraceBadge } from "./components/AITraceBadge.js"
import { AITracePanel } from "./components/AITracePanel.js"
import { AppShell } from "./components/AppShell.js"
import { AvailabilityHeatmap } from "./components/AvailabilityHeatmap.js"
import { BuilderIdLogin } from "./components/BuilderIdLogin.js"
import { ContextForm } from "./components/ContextForm.js"
import { KnowledgeGapsList } from "./components/KnowledgeGapsList.js"
import { KnowledgeProfileView } from "./components/KnowledgeProfileView.js"
import { LandingView } from "./components/LandingView.js"
import { LearningPathView } from "./components/LearningPathView.js"
import { LearningReportView } from "./components/LearningReportView.js"
import { ModeSelector } from "./components/ModeSelector.js"
import { Alert } from "./components/ui/Alert.js"
import { Button } from "./components/ui/Button.js"
import { SAMPLE_HEATMAP_AVAILABILITY } from "./fixtures/availability-heatmap.js"
import { createPathfinderDataProvider } from "./providers/index.js"
import { colors, radii, shadows } from "./theme/tokens.js"

export function resolveAuthRedirectUri(
  envUri = import.meta.env.VITE_AUTH_REDIRECT_URI,
  windowOrigin = typeof window !== "undefined" && window.location?.origin
    ? window.location.origin
    : null,
): string {
  if (envUri) return envUri
  if (windowOrigin) return `${windowOrigin}/callback`
  return "https://charlasreinvent.netlify.app/callback"
}

// Catálogo demo normalizado (local-first; sin AWS). Decisión de alcance WI-013.
const DEMO_SESSIONS: readonly SessionCandidate[] =
  SAMPLE_RAW_SESSIONS.map(normalizeAwsSession)
const tokenStore = new SessionStorageTokenStore()
const authClient = new AwsBuilderIdAuthClient({
  redirectUri: resolveAuthRedirectUri(),
  tokenStore,
})
const liveEventId = import.meta.env.VITE_AWS_EVENT_ID || "reinvent-2026"
export const eventsApiBaseUrl = import.meta.env.DEV
  ? "/aws-events/v1"
  : "https://api.awsevents.com/v1"
const liveEventsClient = new AwsEventsClient({
  baseUrl: eventsApiBaseUrl,
  eventId: liveEventId,
  tokenStore,
})
type LiveAvailabilitySnapshot = Awaited<
  ReturnType<AwsEventsClient["fetchAvailabilitySnapshot"]>
>
type LiveScheduleSnapshot = Awaited<
  ReturnType<AwsEventsClient["getPersonalSchedule"]>
>

export function selectAvailabilitySnapshot(
  snapshot: LiveAvailabilitySnapshot | null,
  mode: ExperienceMode = "live",
) {
  if (mode === "demo") {
    return {
      sessions: DEMO_SESSIONS,
      availability: SAMPLE_HEATMAP_AVAILABILITY,
      source: "fixture" as const,
    }
  }
  return snapshot
    ? { ...snapshot, source: "live" as const }
    : {
        sessions: DEMO_SESSIONS,
        availability: SAMPLE_HEATMAP_AVAILABILITY,
        source: "fixture" as const,
      }
}

export function describeLiveAvailabilityError(error: unknown): string {
  if (
    error instanceof AwsEventsUnauthorizedError ||
    (error instanceof AwsEventsError && error.statusCode === 401)
  ) {
    return "Inicia sesión con Builder ID para actualizar la disponibilidad."
  }
  if (
    error instanceof AwsEventsForbiddenError ||
    (error instanceof AwsEventsError && error.statusCode === 403)
  ) {
    return "Tu registro no tiene acceso a la disponibilidad de este evento."
  }
  if (
    error instanceof AwsEventsThrottlingError ||
    (error instanceof AwsEventsError && error.statusCode === 429)
  ) {
    return "AWS Events está limitando las solicitudes. Espera un momento e inténtalo de nuevo."
  }
  return "No fue posible actualizar la disponibilidad desde AWS Events."
}

export function describeLiveScheduleError(error: unknown): string {
  if (
    error instanceof AwsEventsNotFoundError ||
    (error instanceof AwsEventsError && error.statusCode === 404)
  ) {
    return "Ese favorito ya no existe en AWS Events; actualiza tu agenda para reconciliarla."
  }
  return describeLiveAvailabilityError(error).replace(
    "la disponibilidad",
    "tu agenda",
  )
}

export function describeLiveReservationError(error: unknown): string {
  if (
    error instanceof AwsEventsNotFoundError ||
    (error instanceof AwsEventsError && error.statusCode === 404)
  ) {
    return "Esa reserva ya no existe en AWS Events; actualiza tu agenda para reconciliarla."
  }
  return describeLiveAvailabilityError(error).replace(
    "la disponibilidad",
    "tu reserva",
  )
}

export function describeReservationFailures(
  failed: readonly { readonly code?: string }[],
): string {
  const codes = failed.map((failure) => failure.code?.toLowerCase() ?? "")
  if (codes.some((code) => code.includes("full")))
    return "La sesión está llena; se mostró la agenda confirmada."
  if (codes.some((code) => code.includes("conflict")))
    return "La sesión entra en conflicto con tu agenda; se mostró la agenda confirmada."
  if (
    codes.some((code) => code.includes("already") || code.includes("reserved"))
  )
    return "La sesión ya estaba reservada; se mostró la agenda confirmada."
  return `AWS Events rechazó ${failed.length} reserva(s); se mostró la agenda confirmada.`
}

export function describeReservationReconciliation(input: {
  readonly wasReserved: boolean
  readonly sessionId: string
  readonly reservedSessionIds: readonly string[]
  readonly failed: readonly { readonly code?: string }[]
}): string {
  const reservationConfirmed = input.reservedSessionIds.includes(
    input.sessionId,
  )
  if (!input.wasReserved && reservationConfirmed)
    return "Reserva confirmada por AWS Events."
  if (input.wasReserved && !reservationConfirmed)
    return "Cancelación de reserva confirmada por AWS Events."
  if (input.failed.length) return describeReservationFailures(input.failed)
  return input.wasReserved
    ? "AWS Events no confirmó la cancelación de la reserva."
    : "AWS Events no confirmó la reserva."
}

export const LEGACY_JOURNEY_STORAGE_KEY = "pathfinder_journey_state"
export const MODE_STORAGE_KEY = "pathfinder_experience_mode"
export const HAS_CHOSEN_MODE_STORAGE_KEY = "pathfinder_mode_chosen"

export function getJourneyStorageKey(mode: ExperienceMode): string {
  return `pathfinder_journey_state_${mode}`
}

export interface SavedJourneyState {
  readonly mode?: ExperienceMode
  readonly activeCatalog?: readonly SessionCandidate[]
  readonly traces?: Partial<Record<ExecutionStage, StageExecutionTrace>>
  readonly analysisResult: AnalyzeContextResponse | null
  readonly learningPath: LearningPath | null
  readonly recommendations: readonly SessionRecommendation[]
  readonly currentGaps: readonly KnowledgeGap[]
  readonly initialGaps: readonly KnowledgeGap[]
  readonly reflections?: readonly Reflection[]
  readonly learningReport: LearningReport | null
}

export function migrateLegacyJourneyState(): void {
  if (typeof window === "undefined") return
  try {
    const raw = window.localStorage.getItem(LEGACY_JOURNEY_STORAGE_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw)
    const targetMode: ExperienceMode =
      parsed?.mode === "live" ? "live" : "demo"
    const targetKey = getJourneyStorageKey(targetMode)
    if (!window.localStorage.getItem(targetKey)) {
      window.localStorage.setItem(targetKey, raw)
    }
    window.localStorage.removeItem(LEGACY_JOURNEY_STORAGE_KEY)
  } catch {
    // Ignore migration errors
  }
}

export function loadSavedJourney(mode: ExperienceMode): Partial<SavedJourneyState> {
  if (typeof window === "undefined") return {}
  migrateLegacyJourneyState()
  try {
    const key = getJourneyStorageKey(mode)
    const raw = window.localStorage.getItem(key)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (typeof parsed !== "object" || parsed === null) return {}
    if (parsed.mode && parsed.mode !== mode) return {}
    if (parsed.learningReport && !parsed.learningReport.reflectionsSummary) {
      parsed.learningReport = {
        ...parsed.learningReport,
        reflectionsSummary: {
          totalReflections: 0,
          averageRating: 0,
          items: [],
          keyActionItems: [],
        },
      }
    }
    return parsed
  } catch {
    return {}
  }
}

export function clearJourneyState(mode?: ExperienceMode): void {
  if (typeof window === "undefined") return
  try {
    if (mode) {
      window.localStorage.removeItem(getJourneyStorageKey(mode))
    } else {
      window.localStorage.removeItem(getJourneyStorageKey("demo"))
      window.localStorage.removeItem(getJourneyStorageKey("live"))
      window.localStorage.removeItem(LEGACY_JOURNEY_STORAGE_KEY)
    }
  } catch {
    // Ignore storage errors
  }
}

export const App: React.FC = () => {
  const [mode, setMode] = useState<ExperienceMode>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = window.localStorage.getItem(MODE_STORAGE_KEY)
        if (stored === "demo" || stored === "live") return stored
      } catch {
        // Ignore localStorage access errors in private/restricted environments
      }
    }
    return "demo"
  })

  const [hasChosenMode, setHasChosenMode] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try {
        const storedChosen = window.localStorage.getItem(HAS_CHOSEN_MODE_STORAGE_KEY)
        if (storedChosen === "true") return true
        if (window.localStorage.getItem(MODE_STORAGE_KEY)) return true
      } catch {
        // Ignore localStorage access errors
      }
    }
    return false
  })

  const savedJourney = loadSavedJourney(mode)

  const dataProvider = useMemo(
    () => createPathfinderDataProvider(mode, { liveEventsClient }),
    [mode],
  )

  const [activeCatalog, setActiveCatalog] = useState<
    readonly SessionCandidate[]
  >(() => savedJourney.activeCatalog ?? (mode === "demo" ? DEMO_SESSIONS : []))
  const [traces, setTraces] = useState<
    Partial<Record<ExecutionStage, StageExecutionTrace>>
  >(() => savedJourney.traces ?? {})

  const recordTrace = (trace: StageExecutionTrace) => {
    setTraces((prev) => ({ ...prev, [trace.stage]: trace }))
  }

  const [analysisResult, setAnalysisResult] =
    useState<AnalyzeContextResponse | null>(() => savedJourney.analysisResult ?? null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [learningPath, setLearningPath] = useState<LearningPath | null>(() => savedJourney.learningPath ?? null)
  const [recommendations, setRecommendations] = useState<
    readonly SessionRecommendation[]
  >(() => savedJourney.recommendations ?? [])
  const [currentGaps, setCurrentGaps] = useState<readonly KnowledgeGap[]>(() => savedJourney.currentGaps ?? [])
  const [initialGaps, setInitialGaps] = useState<readonly KnowledgeGap[]>(() => savedJourney.initialGaps ?? [])
  const [reflections, setReflections] = useState<readonly Reflection[]>(
    () => savedJourney.reflections ?? [],
  )
  const [learningReport, setLearningReport] = useState<LearningReport | null>(
    () => savedJourney.learningReport ?? null,
  )
  const [isBuildingPath, setIsBuildingPath] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() =>
    Boolean(tokenStore.getAccessToken()),
  )
  const [liveSnapshot, setLiveSnapshot] =
    useState<LiveAvailabilitySnapshot | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return
    const key = getJourneyStorageKey(mode)
    try {
      if (analysisResult || learningPath || currentGaps.length > 0) {
        window.localStorage.setItem(
          key,
          JSON.stringify({
            mode,
            activeCatalog,
            traces,
            analysisResult,
            learningPath,
            recommendations,
            currentGaps,
            initialGaps,
            reflections,
            learningReport,
          }),
        )
      } else {
        window.localStorage.removeItem(key)
      }
    } catch {
      // Ignore storage errors in restricted contexts
    }
  }, [mode, activeCatalog, traces, analysisResult, learningPath, recommendations, currentGaps, initialGaps, reflections, learningReport])

  const handleSelectMode = (newMode: ExperienceMode, skipConfirm = false) => {
    if (newMode === mode) {
      setHasChosenMode(true)
      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem(HAS_CHOSEN_MODE_STORAGE_KEY, "true")
        } catch {
          // Ignore
        }
      }
      return
    }

    if (!skipConfirm && (analysisResult || learningPath || currentGaps.length > 0)) {
      if (typeof window !== "undefined") {
        const ok = window.confirm(
          `¿Deseas cambiar a Modo ${newMode === "live" ? "Live" : "Demo"}? El progreso actual en Modo ${mode === "live" ? "Live" : "Demo"} se mantendrá guardado de forma independiente.`,
        )
        if (!ok) return
      }
    }

    // 1. Persist current mode's journey before switching
    if (typeof window !== "undefined") {
      try {
        const currentKey = getJourneyStorageKey(mode)
        if (analysisResult || learningPath || currentGaps.length > 0) {
          window.localStorage.setItem(
            currentKey,
            JSON.stringify({
              mode,
              activeCatalog,
              traces,
              analysisResult,
              learningPath,
              recommendations,
              currentGaps,
              initialGaps,
              reflections,
              learningReport,
            }),
          )
        }
        window.localStorage.setItem(MODE_STORAGE_KEY, newMode)
        window.localStorage.setItem(HAS_CHOSEN_MODE_STORAGE_KEY, "true")
      } catch {
        // Ignore localStorage access errors
      }
    }

    setHasChosenMode(true)

    // 2. Load isolated target state
    const targetState = loadSavedJourney(newMode)
    setMode(newMode)
    setActiveCatalog(
      targetState.activeCatalog ??
        (newMode === "demo" ? DEMO_SESSIONS : (liveSnapshot?.sessions ?? [])),
    )
    setTraces(targetState.traces ?? {})
    setAnalysisResult(targetState.analysisResult ?? null)
    setLearningPath(targetState.learningPath ?? null)
    setRecommendations(targetState.recommendations ?? [])
    setCurrentGaps(targetState.currentGaps ?? [])
    setInitialGaps(targetState.initialGaps ?? [])
    setReflections(targetState.reflections ?? [])
    setLearningReport(targetState.learningReport ?? null)
    setError(null)
  }

  const [isRefreshingAvailability, setIsRefreshingAvailability] =
    useState(false)
  const [availabilityMessage, setAvailabilityMessage] = useState<string | null>(
    null,
  )
  const [scheduleSnapshot, setScheduleSnapshot] =
    useState<LiveScheduleSnapshot | null>(null)
  const [scheduleMessage, setScheduleMessage] = useState<string | null>(null)
  const [isRefreshingSchedule, setIsRefreshingSchedule] = useState(false)
  const [favoriteMutationSessionId, setFavoriteMutationSessionId] = useState<
    string | null
  >(null)
  const [reservationMutationSessionId, setReservationMutationSessionId] =
    useState<string | null>(null)

  const isAutoLoadingRef = useRef(false)

  // Autocarga en modo Demo
  useEffect(() => {
    if (mode === "demo") {
      if (!scheduleSnapshot) {
        void dataProvider.schedule
          .getSchedule()
          .then(setScheduleSnapshot)
          .catch(() => {})
      }
    }
  }, [mode, dataProvider, scheduleSnapshot])

  // Autocarga en modo Live autenticado
  useEffect(() => {
    if (
      mode !== "live" ||
      !isAuthenticated ||
      !liveEventsClient ||
      !tokenStore.getAccessToken()
    ) {
      return
    }

    if (liveSnapshot && scheduleSnapshot) return
    if (isAutoLoadingRef.current) return

    isAutoLoadingRef.current = true
    setIsRefreshingAvailability(true)
    setIsRefreshingSchedule(true)

    let isCancelled = false

    Promise.all([
      !liveSnapshot
        ? liveEventsClient.fetchAvailabilitySnapshot().catch((err: unknown) => {
            if (!isCancelled) {
              setAvailabilityMessage(describeLiveAvailabilityError(err))
            }
            return null
          })
        : Promise.resolve(liveSnapshot),
      !scheduleSnapshot
        ? dataProvider.schedule.getSchedule().catch((err: unknown) => {
            if (!isCancelled) {
              setScheduleMessage(describeLiveScheduleError(err))
            }
            return null
          })
        : Promise.resolve(scheduleSnapshot),
    ])
      .then(([availSnap, schedSnap]) => {
        if (isCancelled) return
        if (availSnap && !liveSnapshot) {
          setLiveSnapshot(availSnap)
          setAvailabilityMessage(
            `Disponibilidad sincronizada automáticamente (${availSnap.sessions.length} sesiones).`,
          )
        }
        if (schedSnap && !scheduleSnapshot) {
          setScheduleSnapshot(schedSnap)
          setScheduleMessage(
            `Agenda sincronizada automáticamente (${schedSnap.reservedSessionIds.length} reserva(s), ${schedSnap.favoriteSessionIds.length} favorita(s)).`,
          )
        }
      })
      .finally(() => {
        isAutoLoadingRef.current = false
        if (!isCancelled) {
          setIsRefreshingAvailability(false)
          setIsRefreshingSchedule(false)
        }
      })

    return () => {
      isCancelled = true
    }
  }, [mode, isAuthenticated, liveEventsClient, dataProvider, liveSnapshot, scheduleSnapshot])
  const [route, setRoute] = useState(() =>
    typeof window === "undefined" ? "/" : window.location.pathname,
  )
  const isAvailabilityRoute = route === "/availability"
  const isCallbackRoute = route === "/callback"
  const isAboutRoute = route === "/about"
  const availabilityView = selectAvailabilitySnapshot(liveSnapshot, mode)

  useEffect(() => {
    const onPopState = () => setRoute(window.location.pathname)
    window.addEventListener("popstate", onPopState)
    return () => window.removeEventListener("popstate", onPopState)
  }, [])

  const navigate = (
    path: "/" | "/availability" | "/about" | "/callback",
  ) => {
    if (typeof window !== "undefined" && window.location.pathname !== path) {
      window.history.pushState({}, "", path)
    }
    setRoute(path)
  }

  const handleContextSubmit = async (request: AnalyzeContextRequest) => {
    setIsLoading(true)
    setError(null)
    try {
      let result: AnalyzeContextResponse
      let engine: "bedrock" | "heuristic" = "heuristic"

      if (mode === "demo") {
        // En modo Demo se utiliza exclusivamente el motor heurístico local (sin red ni costos AWS)
        const analyzer = new HeuristicContextAnalyzer()
        result = await analyzer.analyze(request)
        engine = "heuristic"
      } else {
        // En modo Live se invoca Amazon Bedrock real con fallback controlado
        try {
          const response = await fetch("/api/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(request),
          })
          if (response.ok) {
            result = await response.json()
            engine = "bedrock"
          } else {
            throw new Error(`API error ${response.status}`)
          }
        } catch {
          engine = "heuristic"
          const analyzer = new HeuristicContextAnalyzer()
          result = await analyzer.analyze(request)
        }
      }

      recordTrace({
        stage: "context_analysis",
        stageName: "Diagnóstico de Competencias",
        engine,
        modelId: result.modelId,
        summary:
          engine === "bedrock"
            ? `Inferencia generativa de Knowledge Profile con modelo ${result.modelId}`
            : mode === "demo"
              ? "Diagnóstico heurístico local del modo Demo (sin llamadas externas a AWS Bedrock)"
              : "Fallback heurístico local tras indisponibilidad temporal de Amazon Bedrock",
        executedAt: new Date().toISOString(),
      })
      setAnalysisResult(result)
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Error al analizar el contexto.",
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleBuildLearningPath = async () => {
    if (!analysisResult) return
    setIsBuildingPath(true)
    setError(null)
    try {
      // 1. Obtener catálogo desde el provider activo (sin fallback silencioso en Live)
      const candidateSessionsToRank = await dataProvider.catalog.getCatalog()
      setActiveCatalog(candidateSessionsToRank)

      let currentSchedule: UserScheduleResult
      try {
        currentSchedule = await dataProvider.schedule.getSchedule()
      } catch {
        currentSchedule = {
          reservedSessionIds: [],
          favoriteSessionIds: [],
          personalTime: [],
          lastSyncedAt: new Date().toISOString(),
          items: [],
        }
      }

      // 2. Rank recommendations: Demo usa ranking heurístico; Live invoca Bedrock real
      let ranked: RankRecommendationsResponse
      let rankEngine: "bedrock" | "heuristic" = "heuristic"
      const rankRequest: RankRecommendationsRequest = {
        projectContext: analysisResult.projectContext,
        knowledgeGaps: analysisResult.knowledgeGaps,
        candidateSessions: candidateSessionsToRank,
      }

      if (mode === "demo") {
        const reranker = new HeuristicSessionReranker()
        ranked = await reranker.rank(rankRequest)
        rankEngine = "heuristic"
      } else {
        try {
          const response = await fetch("/api/recommendations/rank", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(rankRequest),
          })
          if (response.ok) {
            ranked = await response.json()
            rankEngine = "bedrock"
          } else {
            throw new Error(`API error ${response.status}`)
          }
        } catch {
          rankEngine = "heuristic"
          const reranker = new HeuristicSessionReranker()
          ranked = await reranker.rank(rankRequest)
        }
      }

      recordTrace({
        stage: "session_ranking",
        stageName: "Ranking de Sesiones",
        engine: rankEngine,
        modelId: ranked.modelId,
        summary:
          rankEngine === "bedrock"
            ? `Reranking semántico con Amazon Bedrock (${ranked.modelId})`
            : mode === "demo"
              ? "Reranking heurístico local del modo Demo (aislado de AWS Bedrock)"
              : "Fallback a ranking heurístico local tras contingencia de Bedrock",
        executedAt: new Date().toISOString(),
      })

      // 3. Build the LearningPath and reconcile with the schedule.
      const path = buildLearningPath({
        recommendations: ranked.recommendations,
        candidateSessions: candidateSessionsToRank,
        scheduledItems: currentSchedule.items,
        userId: "local-user",
        journeyId: analysisResult.projectContext.id,
      })

      recordTrace({
        stage: "path_construction",
        stageName: "Construcción de Learning Path",
        engine: "deterministic",
        summary:
          "Evaluación determinística de conflictos y reconciliación con la agenda",
        executedAt: new Date().toISOString(),
      })

      setRecommendations(ranked.recommendations)
      setCurrentGaps(analysisResult.knowledgeGaps)
      // Snapshot inicial de gaps para el Learning Report (Journey 6).
      setInitialGaps(analysisResult.knowledgeGaps)
      setLearningReport(null)
      setLearningPath(path)
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Error al construir el Learning Path.",
      )
    } finally {
      setIsBuildingPath(false)
    }
  }

  // Cierra el ciclo del producto (Journey 6): contrasta los gaps iniciales con
  // los actuales (tras reflexiones) y genera el Learning Report. Local-first.
  const handleGenerateReport = () => {
    const report = buildLearningReport({ initialGaps, currentGaps, reflections })
    recordTrace({
      stage: "report_generation",
      stageName: "Síntesis de Learning Report",
      engine: "deterministic",
      summary:
        "Comparación determinística de brechas cubiertas vs pendientes y consolidación de reflexiones",
      executedAt: new Date().toISOString(),
    })
    setLearningReport(report)
  }

  // Cierra el ciclo adaptativo (Journey 5): aplica la reflexión, recalcula gaps,
  // recomendaciones y Learning Path usando el catálogo activo del Journey.
  const handleReflectionSubmit = async (reflection: Reflection) => {
    if (!analysisResult || !learningPath) return
    setError(null)
    try {
      let currentSchedule: UserScheduleResult
      try {
        currentSchedule = await dataProvider.schedule.getSchedule()
      } catch {
        currentSchedule = {
          reservedSessionIds: [],
          favoriteSessionIds: [],
          personalTime: [],
          lastSyncedAt: new Date().toISOString(),
          items: [],
        }
      }

      const result = await adaptLearningPathFromReflection({
        reflection,
        gaps: currentGaps,
        candidateSessions: activeCatalog,
        projectContext: analysisResult.projectContext,
        scheduledItems: currentSchedule.items,
        userId: "local-user",
        journeyId: analysisResult.projectContext.id,
      })
      recordTrace({
        stage: "reflection_adaptation",
        stageName: "Reflexión Adaptativa",
        engine: "heuristic",
        summary:
          "Reajuste heurístico de gaps y recomendaciones tras feedback de sesión",
        executedAt: new Date().toISOString(),
      })
      const nextReflections = [...reflections, reflection]
      setReflections(nextReflections)
      setCurrentGaps(result.updatedGaps)
      setRecommendations(result.recommendations)
      setLearningPath(result.learningPath)
      if (learningReport) {
        setLearningReport(
          buildLearningReport({
            initialGaps,
            currentGaps: result.updatedGaps,
            reflections: nextReflections,
          }),
        )
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al adaptar la ruta.")
    }
  }

  const handleReset = () => {
    setActiveCatalog(DEMO_SESSIONS)
    setTraces({})
    setAnalysisResult(null)
    setLearningPath(null)
    setRecommendations([])
    setCurrentGaps([])
    setInitialGaps([])
    setReflections([])
    setLearningReport(null)
    clearJourneyState(mode)
  }

  const handleAvailabilityRefresh = async () => {
    if (mode === "demo") {
      setIsRefreshingAvailability(true)
      try {
        const avail = await dataProvider.availability.getAvailability()
        setAvailabilityMessage(
          `Disponibilidad demo sincronizada (${avail.length} sesiones).`,
        )
      } finally {
        setIsRefreshingAvailability(false)
      }
      return
    }
    if (!liveEventsClient) {
      setAvailabilityMessage(
        "Configura VITE_AWS_EVENT_ID para consultar AWS Events.",
      )
      return
    }
    if (!isAuthenticated || !tokenStore.getAccessToken()) {
      setAvailabilityMessage(
        "Inicia sesión con Builder ID para actualizar la disponibilidad.",
      )
      return
    }

    setIsRefreshingAvailability(true)
    setAvailabilityMessage(null)
    try {
      const snapshot = await liveEventsClient.fetchAvailabilitySnapshot()
      setLiveSnapshot(snapshot)
      setAvailabilityMessage(
        `Disponibilidad actualizada exitosamente (${snapshot.sessions.length} sesiones sincronizadas).`,
      )
    } catch (err: unknown) {
      setAvailabilityMessage(
        `${describeLiveAvailabilityError(err)}${liveSnapshot ? " Se conserva el último snapshot válido." : " No se pudo obtener la disponibilidad en vivo."}`,
      )
    } finally {
      setIsRefreshingAvailability(false)
    }
  }

  const canLoadSchedule = Boolean(
    mode === "demo" ||
      (liveEventsClient &&
        isAuthenticated &&
        tokenStore.getAccessToken() &&
        liveSnapshot),
  )

  const handleScheduleRefresh = async () => {
    if (mode === "demo") {
      setIsRefreshingSchedule(true)
      try {
        const schedule = await dataProvider.schedule.getSchedule()
        setScheduleSnapshot(schedule)
        setScheduleMessage(
          `Agenda sincronizada exitosamente (${schedule.reservedSessionIds.length} reserva(s), ${schedule.favoriteSessionIds.length} favorita(s)).`,
        )
      } finally {
        setIsRefreshingSchedule(false)
      }
      return
    }
    if (!liveEventsClient || !liveSnapshot) {
      setScheduleMessage(
        "Actualiza primero la disponibilidad live para consultar tu agenda.",
      )
      return
    }
    if (!isAuthenticated || !tokenStore.getAccessToken()) {
      setScheduleMessage(
        "Inicia sesión con Builder ID para consultar tu agenda.",
      )
      return
    }
    setIsRefreshingSchedule(true)
    setScheduleMessage(null)
    try {
      const schedule = await dataProvider.schedule.getSchedule()
      setScheduleSnapshot(schedule)
      setScheduleMessage(
        `Agenda sincronizada exitosamente (${schedule.reservedSessionIds.length} reserva(s), ${schedule.favoriteSessionIds.length} favorita(s)).`,
      )
    } catch (err: unknown) {
      setScheduleMessage(
        `${describeLiveScheduleError(err)}${scheduleSnapshot ? " Se conserva la última agenda confirmada." : ""}`,
      )
    } finally {
      setIsRefreshingSchedule(false)
    }
  }

  const handleToggleFavorite = async (
    sessionId: string,
    isFavorite: boolean,
  ) => {
    if (
      mode === "live" &&
      (!liveEventsClient || !isAuthenticated || !tokenStore.getAccessToken())
    )
      return
    setFavoriteMutationSessionId(sessionId)
    setScheduleMessage(null)
    try {
      const result = await dataProvider.schedule.toggleFavorite(
        sessionId,
        isFavorite,
      )
      const reconciled = await dataProvider.schedule.getSchedule()
      setScheduleSnapshot(reconciled)
      if (mode === "demo") {
        setScheduleMessage(
          isFavorite
            ? "Favorito removido (Modo Demo)."
            : "Favorito guardado (Modo Demo).",
        )
      } else {
        setScheduleMessage(
          result.failed.length
            ? `AWS Events rechazó ${result.failed.length} favorito(s); se mostró la agenda confirmada.`
            : "Agenda reconciliada con AWS Events.",
        )
      }
    } catch (err: unknown) {
      try {
        setScheduleSnapshot(await dataProvider.schedule.getSchedule())
      } catch {
        // Preserve the last confirmed schedule when reconciliation also fails.
      }
      setScheduleMessage(
        mode === "demo"
          ? "Error al actualizar favorito en demo."
          : describeLiveScheduleError(err),
      )
    } finally {
      setFavoriteMutationSessionId(null)
    }
  }

  const handleToggleReservation = async (
    sessionId: string,
    isReserved: boolean,
  ) => {
    if (
      mode === "live" &&
      (!liveEventsClient || !isAuthenticated || !tokenStore.getAccessToken())
    )
      return
    setReservationMutationSessionId(sessionId)
    setScheduleMessage(null)
    try {
      const result = await dataProvider.schedule.toggleReservation(
        sessionId,
        isReserved,
      )
      const reconciled = await dataProvider.schedule.getSchedule()
      setScheduleSnapshot(reconciled)
      if (mode === "demo") {
        setScheduleMessage(
          isReserved
            ? "Cancelación de reserva confirmada (Modo Demo)."
            : "Reserva confirmada (Modo Demo).",
        )
      } else {
        setScheduleMessage(
          describeReservationReconciliation({
            wasReserved: isReserved,
            sessionId,
            reservedSessionIds: reconciled.reservedSessionIds,
            failed: result.failed,
          }),
        )
      }
    } catch (err: unknown) {
      try {
        setScheduleSnapshot(await dataProvider.schedule.getSchedule())
      } catch {
        // Preserve the last confirmed schedule when reconciliation also fails.
      }
      setScheduleMessage(
        mode === "demo"
          ? "Error al actualizar reserva en demo."
          : describeLiveReservationError(err),
      )
    } finally {
      setReservationMutationSessionId(null)
    }
  }

  const activeJourneyStep = learningReport
    ? ("report" as const)
    : learningPath
      ? ("path" as const)
      : analysisResult
        ? ("diagnosis" as const)
        : ("context" as const)

  return (
    <AppShell
      currentRoute={route}
      onNavigate={navigate}
      mode={mode}
      onSelectMode={handleSelectMode}
      isAuthenticated={isAuthenticated}
      activeStep={activeJourneyStep}
      authSlot={
        !isCallbackRoute && mode === "live" ? (
          <BuilderIdLogin
            client={authClient}
            authenticated={isAuthenticated}
            onAuthenticated={() => {
              setIsAuthenticated(true)
              setRoute("/")
            }}
            onLogout={() => {
              tokenStore.clear()
              setIsAuthenticated(false)
              setScheduleSnapshot(null)
              setScheduleMessage(null)
            }}
          />
        ) : null
      }
    >
      {isAboutRoute ? (
        <LandingView
          onNavigateDemo={() => {
            handleSelectMode("demo")
            navigate("/availability")
          }}
          onNavigateHome={() => navigate("/")}
        />
      ) : isAvailabilityRoute ? (
        <AvailabilityHeatmap
          sessions={availabilityView.sessions}
          availability={availabilityView.availability}
          source={availabilityView.source}
          snapshotAt={liveSnapshot?.observedAt}
          liveStatus={availabilityMessage ?? scheduleMessage ?? undefined}
          isRefreshing={isRefreshingAvailability}
          canRefreshLive={mode === "live" && isAuthenticated}
          onRefreshLive={handleAvailabilityRefresh}
          onReturnHome={() => navigate("/")}
          schedule={scheduleSnapshot ?? undefined}
          isRefreshingSchedule={isRefreshingSchedule}
          canRefreshSchedule={mode === "live" && canLoadSchedule}
          onRefreshSchedule={handleScheduleRefresh}
          onToggleFavorite={handleToggleFavorite}
          favoriteMutationSessionId={favoriteMutationSessionId}
          onToggleReservation={handleToggleReservation}
          reservationMutationSessionId={reservationMutationSessionId}
        />
      ) : isCallbackRoute ? (
        <BuilderIdLogin
          client={authClient}
          authenticated={isAuthenticated}
          onAuthenticated={() => {
            setIsAuthenticated(true)
            setRoute("/")
          }}
          onLogout={() => {
            tokenStore.clear()
            setIsAuthenticated(false)
            setScheduleSnapshot(null)
            setScheduleMessage(null)
          }}
        />
      ) : (
        <>
          {!hasChosenMode && (
            <ModeSelector
              currentMode={mode}
              onSelectMode={(m) => handleSelectMode(m, true)}
              isAuthenticated={isAuthenticated}
            />
          )}

          {error && (
            <Alert
              variant="danger"
              style={{ marginBottom: "1.5rem" }}
              onDismiss={() => setError(null)}
            >
              {error}
            </Alert>
          )}

          {mode === "live" && !isAuthenticated ? (
            <section
              style={{
                backgroundColor: colors.neutral.white,
                padding: "2.5rem 2rem",
                borderRadius: radii.xl,
                border: `1px solid ${colors.neutral.slate200}`,
                textAlign: "center",
                maxWidth: "600px",
                margin: "2.5rem auto",
                boxShadow: shadows.sm,
              }}
            >
              <div
                style={{
                  width: "52px",
                  height: "52px",
                  borderRadius: radii.full,
                  backgroundColor: colors.brand.orangeMuted,
                  color: colors.brand.orange,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 1.25rem auto",
                }}
              >
                <Lock size={26} strokeWidth={2.2} />
              </div>
              <h2
                style={{
                  marginTop: 0,
                  fontSize: "1.35rem",
                  color: colors.brand.navy,
                  fontWeight: 700,
                }}
              >
                Inicio de sesión requerido (Modo Live)
              </h2>
              <p
                style={{
                  color: colors.neutral.slate600,
                  fontSize: "0.95rem",
                  lineHeight: 1.6,
                  marginBottom: "2rem",
                }}
              >
                Para consultar el catálogo oficial de sesiones desde la API de <strong>AWS Events</strong> y construir tu ruta de aprendizaje con <strong>AWS Bedrock</strong>, es necesario autenticarte con tu cuenta de <strong>AWS Builder ID</strong>. Si prefieres explorar sin credenciales, cambia al <strong>Modo Demo</strong>.
              </p>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "1rem",
                  flexWrap: "wrap",
                }}
              >
                <BuilderIdLogin
                  client={authClient}
                  authenticated={isAuthenticated}
                  onAuthenticated={() => {
                    setIsAuthenticated(true)
                    setRoute("/")
                  }}
                  onLogout={() => {
                    tokenStore.clear()
                    setIsAuthenticated(false)
                    setScheduleSnapshot(null)
                    setScheduleMessage(null)
                  }}
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleSelectMode("demo", true)}
                >
                  Cambiar a Modo Demo
                </Button>
              </div>
            </section>
          ) : !analysisResult ? (
            <section
              style={{
                backgroundColor: "#f8fafc",
                padding: "1.5rem",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
              }}
            >
              <h2
                style={{ marginTop: 0, fontSize: "1.3rem", color: "#0f172a" }}
              >
                Paso 1: ¿Qué estás construyendo?
              </h2>
              <p
                style={{
                  color: "#64748b",
                  fontSize: "0.9rem",
                  marginBottom: "1.5rem",
                }}
              >
                Describe tu iniciativa o reto arquitectónico. Pathfinder
                extraerá tus competencias actuales y determinará qué
                conocimientos necesitas profundizar.
              </p>
              <ContextForm
                onSubmit={handleContextSubmit}
                isLoading={isLoading}
              />
            </section>
          ) : (
            <section>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "1.5rem",
                  flexWrap: "wrap",
                  gap: "0.5rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <h2 style={{ margin: 0, fontSize: "1.4rem", color: "#0f172a" }}>
                    Tu Diagnóstico de Aprendizaje
                  </h2>
                  <AITraceBadge trace={traces.context_analysis} />
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  style={{
                    padding: "0.4rem 0.8rem",
                    backgroundColor: "#fff",
                    border: "1px solid #cbd5e1",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                  }}
                >
                  ← Modificar Contexto
                </button>
              </div>

              <KnowledgeProfileView
                profile={analysisResult.knowledgeProfile}
                context={analysisResult.projectContext}
                modelId={analysisResult.modelId}
              />

              <KnowledgeGapsList gaps={analysisResult.knowledgeGaps} />

              {!learningPath && (
                <div style={{ marginTop: "2rem", textAlign: "right" }}>
                  <button
                    type="button"
                    disabled={isBuildingPath}
                    style={{
                      padding: "0.8rem 1.6rem",
                      backgroundColor: isBuildingPath ? "#94a3b8" : "#0284c7",
                      color: "#fff",
                      border: "none",
                      borderRadius: "6px",
                      fontWeight: "bold",
                      fontSize: "1rem",
                      cursor: isBuildingPath ? "default" : "pointer",
                    }}
                    onClick={handleBuildLearningPath}
                  >
                    {isBuildingPath
                      ? "Construyendo…"
                      : "Construir Learning Path Recomendado →"}
                  </button>
                </div>
              )}

              {scheduleMessage && (
                <div
                  role="status"
                  style={{
                    padding: "0.6rem 0.8rem",
                    backgroundColor: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    color: "#166534",
                    borderRadius: "6px",
                    marginTop: "1rem",
                    fontSize: "0.85rem",
                  }}
                >
                  {scheduleMessage}
                </div>
              )}

              {learningPath && (
                <div style={{ marginTop: "2rem" }}>
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      alignItems: "center",
                      marginBottom: "0.75rem",
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.85rem",
                        color: "#64748b",
                        fontWeight: 600,
                      }}
                    >
                      Trazabilidad de la Ruta:
                    </span>
                    <AITraceBadge trace={traces.session_ranking} />
                    <AITraceBadge trace={traces.path_construction} />
                    {traces.reflection_adaptation && (
                      <AITraceBadge trace={traces.reflection_adaptation} />
                    )}
                  </div>
                  <LearningPathView
                    learningPath={learningPath}
                    recommendations={recommendations}
                    candidateSessions={activeCatalog}
                    gaps={currentGaps}
                    userId="local-user"
                    onReflectionSubmit={handleReflectionSubmit}
                    onToggleFavorite={handleToggleFavorite}
                    favoriteSessionIds={scheduleSnapshot?.favoriteSessionIds}
                    favoriteMutationSessionId={favoriteMutationSessionId}
                    onToggleReservation={handleToggleReservation}
                    reservedSessionIds={scheduleSnapshot?.reservedSessionIds}
                    reservationMutationSessionId={reservationMutationSessionId}
                  />
                </div>
              )}

              {learningPath && (
                <div style={{ marginTop: "1.5rem", textAlign: "right" }}>
                  <button
                    type="button"
                    onClick={handleGenerateReport}
                    style={{
                      padding: "0.6rem 1.2rem",
                      backgroundColor: "#0f766e",
                      color: "#fff",
                      border: "none",
                      borderRadius: "6px",
                      fontWeight: "bold",
                      fontSize: "0.9rem",
                      cursor: "pointer",
                    }}
                  >
                    {learningReport
                      ? "Actualizar Learning Report"
                      : "Generar Learning Report (cierre de ciclo) →"}
                  </button>
                </div>
              )}

              {learningReport && (
                <div style={{ marginTop: "2rem" }}>
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      alignItems: "center",
                      marginBottom: "0.75rem",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.85rem",
                        color: "#64748b",
                        fontWeight: 600,
                      }}
                    >
                      Trazabilidad del Reporte:
                    </span>
                    <AITraceBadge trace={traces.report_generation} />
                  </div>
                  <LearningReportView report={learningReport} />
                </div>
              )}

              <AITracePanel traces={traces} />
            </section>
          )}
        </>
      )}
    </AppShell>
  )
}
