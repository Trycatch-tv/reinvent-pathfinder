import {
  HeuristicContextAnalyzer,
  HeuristicSessionReranker,
  adaptLearningPathFromReflection,
  buildLearningPath,
} from "@pathfinder/ai-knowledge"
import type {
  AnalyzeContextRequest,
  AnalyzeContextResponse,
  RankRecommendationsRequest,
} from "@pathfinder/contracts"
import type {
  KnowledgeGap,
  LearningPath,
  Reflection,
  SessionCandidate,
  SessionRecommendation,
} from "@pathfinder/domain"
import {
  SAMPLE_RAW_SESSIONS,
  SAMPLE_USER_SCHEDULE,
  AwsBuilderIdAuthClient,
  AwsEventsClient,
  AwsEventsError,
  AwsEventsForbiddenError,
  AwsEventsThrottlingError,
  AwsEventsUnauthorizedError,
  InMemoryTokenStore,
  normalizeAwsSession,
} from "@pathfinder/events-client"
import React, { useEffect, useState } from "react"
import { ContextForm } from "./components/ContextForm.js"
import { KnowledgeGapsList } from "./components/KnowledgeGapsList.js"
import { KnowledgeProfileView } from "./components/KnowledgeProfileView.js"
import { LearningPathView } from "./components/LearningPathView.js"
import { AvailabilityHeatmap } from "./components/AvailabilityHeatmap.js"
import { SAMPLE_HEATMAP_AVAILABILITY } from "./fixtures/availability-heatmap.js"
import { BuilderIdLogin } from "./components/BuilderIdLogin.js"

// Catálogo demo normalizado (local-first; sin AWS). Decisión de alcance WI-013.
const DEMO_SESSIONS: readonly SessionCandidate[] =
  SAMPLE_RAW_SESSIONS.map(normalizeAwsSession)
const tokenStore = new InMemoryTokenStore()
const authClient = new AwsBuilderIdAuthClient({
  redirectUri: "http://localhost:8484/callback",
  tokenStore,
})
const liveEventId = import.meta.env.VITE_AWS_EVENT_ID
export const eventsApiBaseUrl = import.meta.env.DEV
  ? "/aws-events/v1"
  : "https://api.awsevents.com/v1"
const liveEventsClient = liveEventId
  ? new AwsEventsClient({ baseUrl: eventsApiBaseUrl, eventId: liveEventId, tokenStore })
  : null
type LiveAvailabilitySnapshot = Awaited<ReturnType<AwsEventsClient["fetchAvailabilitySnapshot"]>>

export function selectAvailabilitySnapshot(snapshot: LiveAvailabilitySnapshot | null) {
  return snapshot
    ? { ...snapshot, source: "live" as const }
    : { sessions: DEMO_SESSIONS, availability: SAMPLE_HEATMAP_AVAILABILITY, source: "fixture" as const }
}

export function describeLiveAvailabilityError(error: unknown): string {
  if (error instanceof AwsEventsUnauthorizedError || (error instanceof AwsEventsError && error.statusCode === 401)) {
    return "Inicia sesión con Builder ID para actualizar la disponibilidad."
  }
  if (error instanceof AwsEventsForbiddenError || (error instanceof AwsEventsError && error.statusCode === 403)) {
    return "Tu registro no tiene acceso a la disponibilidad de este evento."
  }
  if (error instanceof AwsEventsThrottlingError || (error instanceof AwsEventsError && error.statusCode === 429)) {
    return "AWS Events está limitando las solicitudes. Espera un momento e inténtalo de nuevo."
  }
  return "No fue posible actualizar la disponibilidad desde AWS Events."
}

export const App: React.FC = () => {
  const [analysisResult, setAnalysisResult] =
    useState<AnalyzeContextResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [learningPath, setLearningPath] = useState<LearningPath | null>(null)
  const [recommendations, setRecommendations] = useState<
    readonly SessionRecommendation[]
  >([])
  const [currentGaps, setCurrentGaps] = useState<readonly KnowledgeGap[]>([])
  const [isBuildingPath, setIsBuildingPath] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [liveSnapshot, setLiveSnapshot] = useState<LiveAvailabilitySnapshot | null>(null)
  const [isRefreshingAvailability, setIsRefreshingAvailability] = useState(false)
  const [availabilityMessage, setAvailabilityMessage] = useState<string | null>(null)
  const [route, setRoute] = useState(() => typeof window === "undefined" ? "/" : window.location.pathname)
  const isAvailabilityRoute = route === "/availability"
  const isCallbackRoute = route === "/callback"
  const availabilityView = selectAvailabilitySnapshot(liveSnapshot)

  useEffect(() => {
    const onPopState = () => setRoute(window.location.pathname)
    window.addEventListener("popstate", onPopState)
    return () => window.removeEventListener("popstate", onPopState)
  }, [])

  const navigate = (path: "/" | "/availability") => {
    if (typeof window !== "undefined" && window.location.pathname !== path) {
      window.history.pushState({}, "", path)
    }
    setRoute(path)
  }

  const handleContextSubmit = async (request: AnalyzeContextRequest) => {
    setIsLoading(true)
    setError(null)
    try {
      // Local-first execution using Heuristic analyzer
      const analyzer = new HeuristicContextAnalyzer()
      const result = await analyzer.analyze(request)
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
      // 1. Rank recommendations (local-first heuristic reranker).
      const reranker = new HeuristicSessionReranker()
      const rankRequest: RankRecommendationsRequest = {
        projectContext: analysisResult.projectContext,
        knowledgeGaps: analysisResult.knowledgeGaps,
        candidateSessions: DEMO_SESSIONS,
      }
      const ranked = await reranker.rank(rankRequest)

      // 2. Build the LearningPath and reconcile with the demo schedule.
      const path = buildLearningPath({
        recommendations: ranked.recommendations,
        candidateSessions: DEMO_SESSIONS,
        scheduledItems: SAMPLE_USER_SCHEDULE,
        userId: "local-user",
        journeyId: analysisResult.projectContext.id,
      })

      setRecommendations(ranked.recommendations)
      setCurrentGaps(analysisResult.knowledgeGaps)
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

  // Cierra el ciclo adaptativo (Journey 5): aplica la reflexión, recalcula gaps,
  // recomendaciones y Learning Path. Local-first.
  const handleReflectionSubmit = async (reflection: Reflection) => {
    if (!analysisResult || !learningPath) return
    setError(null)
    try {
      const result = await adaptLearningPathFromReflection({
        reflection,
        gaps: currentGaps,
        candidateSessions: DEMO_SESSIONS,
        projectContext: analysisResult.projectContext,
        scheduledItems: SAMPLE_USER_SCHEDULE,
        userId: "local-user",
        journeyId: analysisResult.projectContext.id,
      })
      setCurrentGaps(result.updatedGaps)
      setRecommendations(result.recommendations)
      setLearningPath(result.learningPath)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al adaptar la ruta.")
    }
  }

  const handleReset = () => {
    setAnalysisResult(null)
    setLearningPath(null)
    setRecommendations([])
    setCurrentGaps([])
  }

  const handleAvailabilityRefresh = async () => {
    if (!liveEventsClient) {
      setAvailabilityMessage("Configura VITE_AWS_EVENT_ID para consultar AWS Events.")
      return
    }
    if (!isAuthenticated || !tokenStore.getAccessToken()) {
      setAvailabilityMessage("Inicia sesión con Builder ID para actualizar la disponibilidad.")
      return
    }

    setIsRefreshingAvailability(true)
    setAvailabilityMessage(null)
    try {
      const snapshot = await liveEventsClient.fetchAvailabilitySnapshot()
      setLiveSnapshot(snapshot)
    } catch (err: unknown) {
      setAvailabilityMessage(`${describeLiveAvailabilityError(err)}${liveSnapshot ? " Se conserva el último snapshot válido." : " Se mantiene el modo fixture local."}`)
    } finally {
      setIsRefreshingAvailability(false)
    }
  }

  return (
    <div
      style={{
        maxWidth: "960px",
        margin: "0 auto",
        padding: "2rem 1rem",
        fontFamily: "system-ui, -apple-system, sans-serif",
        color: "#1f2937",
      }}
    >
      <header
        style={{
          marginBottom: "2rem",
          borderBottom: "2px solid #ea580c",
          paddingBottom: "1rem",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "1.8rem", color: "#0f172a" }}>
          re:Invent Pathfinder
        </h1>
        <p
          style={{ margin: "0.4rem 0 0 0", color: "#475569", fontSize: "1rem" }}
        >
          AI companion que transforma el catálogo de AWS re:Invent en una ruta
          de aprendizaje adaptativa.
        </p>
        {!isAvailabilityRoute && <p style={{ marginBottom: 0 }}><a href="/availability" onClick={(event) => { event.preventDefault(); navigate("/availability") }}>Ver disponibilidad de sesiones</a></p>}
        {!isCallbackRoute && <BuilderIdLogin client={authClient} authenticated={isAuthenticated} onAuthenticated={() => { setIsAuthenticated(true); setRoute("/") }} onLogout={() => setIsAuthenticated(false)} />}
      </header>

      {isAvailabilityRoute ? (
        <AvailabilityHeatmap
          sessions={availabilityView.sessions}
          availability={availabilityView.availability}
          source={availabilityView.source}
          snapshotAt={liveSnapshot?.observedAt}
          liveStatus={availabilityMessage ?? undefined}
          isRefreshing={isRefreshingAvailability}
          canRefreshLive={Boolean(liveEventsClient && isAuthenticated)}
          onRefreshLive={handleAvailabilityRefresh}
          onReturnHome={() => navigate("/")}
        />
      ) : isCallbackRoute ? (
        <BuilderIdLogin client={authClient} authenticated={isAuthenticated} onAuthenticated={() => { setIsAuthenticated(true); setRoute("/") }} onLogout={() => setIsAuthenticated(false)} />
      ) : (
        <>

      {error && (
        <div
          style={{
            backgroundColor: "#fee2e2",
            color: "#b91c1c",
            padding: "0.8rem",
            borderRadius: "6px",
            marginBottom: "1.5rem",
          }}
        >
          {error}
        </div>
      )}

      {!analysisResult ? (
        <section
          style={{
            backgroundColor: "#f8fafc",
            padding: "1.5rem",
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
          }}
        >
          <h2 style={{ marginTop: 0, fontSize: "1.3rem", color: "#0f172a" }}>
            Paso 1: ¿Qué estás construyendo?
          </h2>
          <p
            style={{
              color: "#64748b",
              fontSize: "0.9rem",
              marginBottom: "1.5rem",
            }}
          >
            Describe tu iniciativa o reto arquitectónico. Pathfinder extraerá
            tus competencias actuales y determinará qué conocimientos necesitas
            profundizar.
          </p>
          <ContextForm onSubmit={handleContextSubmit} isLoading={isLoading} />
        </section>
      ) : (
        <section>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1.5rem",
            }}
          >
            <h2 style={{ margin: 0, fontSize: "1.4rem", color: "#0f172a" }}>
              Tu Diagnóstico de Aprendizaje
            </h2>
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

          {learningPath && (
            <LearningPathView
              learningPath={learningPath}
              recommendations={recommendations}
              gaps={currentGaps}
              userId="local-user"
              onReflectionSubmit={handleReflectionSubmit}
            />
          )}
        </section>
      )}
        </>
      )}
    </div>
  )
}
