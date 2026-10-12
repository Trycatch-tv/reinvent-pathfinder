import {
  buildLearningPath,
  buildLearningReport,
} from "@pathfinder/ai-knowledge"
import type {
  ExecutionStage,
  KnowledgeGap,
  KnowledgeProfile,
  ProjectContext,
  Reflection,
  SessionCandidate,
  SessionRecommendation,
  StageExecutionTrace,
} from "@pathfinder/domain"
import {
  AwsEventsForbiddenError,
  AwsEventsThrottlingError,
  AwsEventsUnauthorizedError,
  SAMPLE_RAW_SESSIONS,
  normalizeAwsSession,
} from "@pathfinder/events-client"
import React from "react"
import { renderToString } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import {
  App,
  describeLiveAvailabilityError,
  describeLiveReservationError,
  describeReservationFailures,
  describeReservationReconciliation,
  eventsApiBaseUrl,
  resolveAuthRedirectUri,
  selectAvailabilitySnapshot,
} from "./App.js"
import {
  completeBuilderIdCallback,
  initiateBuilderIdLogin,
  logoutBuilderId,
  type BuilderIdAuthClient,
  type TransactionStorage,
} from "./auth/builder-id-transaction.js"
import { AITraceBadge } from "./components/AITraceBadge.js"
import { AITracePanel } from "./components/AITracePanel.js"
import {
  AvailabilityHeatmap,
  createAvailabilityProjection,
} from "./components/AvailabilityHeatmap.js"
import { ContextForm } from "./components/ContextForm.js"
import { KnowledgeGapsList } from "./components/KnowledgeGapsList.js"
import { KnowledgeProfileView } from "./components/KnowledgeProfileView.js"
import { LandingView } from "./components/LandingView.js"
import { LearningPathView } from "./components/LearningPathView.js"
import { LearningReportView } from "./components/LearningReportView.js"
import { ModeSelector } from "./components/ModeSelector.js"
import { ReflectionForm } from "./components/ReflectionForm.js"
import { SAMPLE_HEATMAP_AVAILABILITY } from "./fixtures/availability-heatmap.js"

const mockProfile: KnowledgeProfile = {
  id: "prof-1",
  userId: "user-1",
  skills: [
    { topic: "BEDROCK", proficiency: "associate" },
    { topic: "DYNAMODB", proficiency: "professional" },
  ],
  targetDomains: ["Artificial Intelligence", "Databases"],
  updatedAt: "2026-10-05T00:00:00Z",
}

const mockContext: ProjectContext = {
  id: "ctx-1",
  name: "re:Invent Agent Core",
  currentStack: ["Bedrock", "DynamoDB"],
  seniority: "advanced",
  goals: ["Build autonomous systems"],
  createdAt: "2026-10-05T00:00:00Z",
  updatedAt: "2026-10-05T00:00:00Z",
}

const mockGaps: KnowledgeGap[] = [
  {
    id: "gap-1",
    topic: "Amazon Bedrock AgentCore & Autonomous Workflows",
    description: "Deep dive into multi-agent orchestration and tools.",
    targetProficiency: "professional",
    severity: "critical",
    status: "open",
    rationale: "Project requires agents",
    addressedBySessionIds: [],
  },
  {
    id: "gap-2",
    topic: "DynamoDB Single-Table Design",
    description: "Advanced partition key strategies.",
    targetProficiency: "professional",
    severity: "important",
    status: "open",
    rationale: "Scalable storage",
    addressedBySessionIds: [],
  },
]

describe("apps/client UI components", () => {
  const heatmapSessions = SAMPLE_RAW_SESSIONS.map(normalizeAwsSession)

  const createStorage = (): TransactionStorage & {
    readonly values: Map<string, string>
  } => {
    const values = new Map<string, string>()
    return {
      values,
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => {
        values.set(key, value)
      },
      removeItem: (key) => {
        values.delete(key)
      },
    }
  }

  const createAuthClient = () => {
    const handleCallback = vi
      .fn()
      .mockImplementation(({ state, expectedState }) =>
        state === expectedState
          ? Promise.resolve({})
          : Promise.reject(new Error("Invalid state")),
      )
    const logout = vi.fn()

    return {
      initiateAuth: vi.fn().mockResolvedValue({
        authorizationUrl: "https://builder-id.example/authorize",
        state: "csrf-state",
        verifier: "pkce-verifier",
      }),
      handleCallback,
      logout,
    } satisfies BuilderIdAuthClient
  }

  it("stores only the PKCE transaction before redirecting", async () => {
    const storage = createStorage()
    const client = createAuthClient()

    await expect(initiateBuilderIdLogin(client, storage)).resolves.toBe(
      "https://builder-id.example/authorize",
    )
    expect([...storage.values.entries()]).toEqual([
      ["pathfinder.builder-id.state", "csrf-state"],
      ["pathfinder.builder-id.verifier", "pkce-verifier"],
    ])
  })

  it("completes a valid callback once and clears the PKCE transaction", async () => {
    const storage = createStorage()
    const client = createAuthClient()
    await initiateBuilderIdLogin(client, storage)

    await expect(
      completeBuilderIdCallback(
        client,
        storage,
        new URLSearchParams("code=authorization-code&state=csrf-state"),
      ),
    ).resolves.toBe("authenticated")
    expect(client.handleCallback).toHaveBeenCalledWith({
      code: "authorization-code",
      state: "csrf-state",
      expectedState: "csrf-state",
      verifier: "pkce-verifier",
    })
    expect(storage.values).toEqual(new Map())
  })

  it("rejects invalid callbacks without exchanging a token", async () => {
    const storage = createStorage()
    const client = createAuthClient()
    await initiateBuilderIdLogin(client, storage)

    await expect(
      completeBuilderIdCallback(
        client,
        storage,
        new URLSearchParams("code=authorization-code&state=wrong"),
      ),
    ).resolves.toBe("invalid-callback")
    expect(client.handleCallback).toHaveBeenCalledTimes(1)
    expect(storage.values).toEqual(new Map())
  })

  it("clears the transaction and in-memory client state on logout", async () => {
    const storage = createStorage()
    const client = createAuthClient()
    await initiateBuilderIdLogin(client, storage)

    logoutBuilderId(client, storage)

    expect(client.logout).toHaveBeenCalledOnce()
    expect(storage.values).toEqual(new Map())
  })

  it("renders the local availability heatmap and session detail from fixtures", () => {
    const html = renderToString(
      React.createElement(AvailabilityHeatmap, {
        sessions: heatmapSessions,
        availability: SAMPLE_HEATMAP_AVAILABILITY,
        initialSelectedSessionId: "sess-aim-301",
        schedule: {
          reservedSessionIds: ["sess-aim-301"],
          favoriteSessionIds: ["sess-aim-301"],
          personalTime: [],
          lastSyncedAt: "2026-10-06T00:00:00.000Z",
          items: [],
        },
        onToggleFavorite: () => {},
        onToggleReservation: () => {},
      }),
    )

    expect(html).toContain("Matriz de disponibilidad por horario y venue")
    expect(html).toContain(
      "Building Autonomous Multi-Agent Systems with Amazon Bedrock AgentCore: Disponible",
    )
    expect(html).toContain("Disponibilidad desconocida")
    expect(html).toContain("Palazzo Ballroom E")
    expect(html).toContain("Modo fixture local")
    expect(html).toContain("Mi agenda")
    expect(html).toContain("Sesiones confirmadas")
    expect(html).toContain(
      "AIM301 — Building Autonomous Multi-Agent Systems with Amazon Bedrock AgentCore",
    )
    expect(html).toContain("Quitar de favoritos")
    expect(html).toContain("Cancelar reserva")
    expect(html).toContain('aria-label="Leyenda de disponibilidad"')
    expect(html).toContain('data-availability-status="available"')
    expect(html).toContain('data-availability-status="limited"')
    expect(html).toContain('data-availability-status="full"')
    expect(html).toContain('data-availability-status="unknown"')
  })

  it("does not offer reservations for a session without available capacity", () => {
    const html = renderToString(
      React.createElement(AvailabilityHeatmap, {
        sessions: heatmapSessions,
        availability: SAMPLE_HEATMAP_AVAILABILITY,
        initialSelectedSessionId: "sess-sec-305",
        onToggleReservation: () => {},
      }),
    )

    expect(html).toContain("Reservas aún no disponibles para esta sesión.")
    expect(html).not.toContain("Reservar sesión")
  })

  it("explains live availability failures without exposing provider details", () => {
    expect(
      describeLiveAvailabilityError(
        new AwsEventsUnauthorizedError("token=secret"),
      ),
    ).toContain("Inicia sesión")
    expect(
      describeLiveAvailabilityError(new AwsEventsForbiddenError()),
    ).toContain("registro")
    expect(
      describeLiveAvailabilityError(new AwsEventsThrottlingError()),
    ).toContain("limitando")
    expect(
      describeLiveReservationError(
        new (class extends Error {
          statusCode = 404
        })(),
      ),
    ).toContain("reserva")
    expect(describeReservationFailures([{ code: "SessionFull" }])).toContain(
      "llena",
    )
    expect(
      describeReservationFailures([{ code: "ScheduleConflict" }]),
    ).toContain("conflicto")
    expect(
      describeReservationFailures([{ code: "AlreadyReserved" }]),
    ).toContain("ya estaba reservada")
    expect(
      describeReservationReconciliation({
        wasReserved: false,
        sessionId: "session-1",
        reservedSessionIds: ["session-1"],
        failed: [],
      }),
    ).toContain("Reserva confirmada")
    expect(
      describeReservationReconciliation({
        wasReserved: false,
        sessionId: "session-1",
        reservedSessionIds: [],
        failed: [],
      }),
    ).toContain("no confirmó la reserva")
    expect(
      describeReservationReconciliation({
        wasReserved: true,
        sessionId: "session-1",
        reservedSessionIds: [],
        failed: [],
      }),
    ).toContain("Cancelación de reserva confirmada")
    expect(
      describeReservationReconciliation({
        wasReserved: true,
        sessionId: "session-1",
        reservedSessionIds: ["session-1"],
        failed: [],
      }),
    ).toContain("no confirmó la cancelación")
  })

  it("reports schedule IDs that are not part of the loaded catalog", () => {
    const html = renderToString(
      React.createElement(AvailabilityHeatmap, {
        sessions: heatmapSessions,
        availability: SAMPLE_HEATMAP_AVAILABILITY,
        schedule: {
          reservedSessionIds: ["sess-aim-301", "not-in-catalog"],
          favoriteSessionIds: [],
          personalTime: [],
          lastSyncedAt: "2026-10-06T00:00:00.000Z",
          items: [],
        },
      }),
    )

    expect(html).toContain(
      "1 sesión(es) de tu agenda aún no aparecen en el catálogo cargado.",
    )
  })

  it("uses Vite's same-origin AWS Events proxy during development", () => {
    expect(eventsApiBaseUrl).toBe("/aws-events/v1")
  })

  it("resolves auth redirect URI prioritizing env, then window origin, then fallback", () => {
    expect(
      resolveAuthRedirectUri(
        "https://custom.example/callback",
        "https://other.example",
      ),
    ).toBe("https://custom.example/callback")
    expect(
      resolveAuthRedirectUri(undefined, "https://charlasreinvent.netlify.app"),
    ).toBe("https://charlasreinvent.netlify.app/callback")
    expect(resolveAuthRedirectUri(undefined, null)).toBe(
      "https://charlasreinvent.netlify.app/callback",
    )
  })

  it("keeps a live snapshot selected after a failed refresh and otherwise falls back to fixtures", () => {
    const fallback = selectAvailabilitySnapshot(null)
    expect(fallback.source).toBe("fixture")

    const snapshot = selectAvailabilitySnapshot({
      sessions: heatmapSessions,
      availability: SAMPLE_HEATMAP_AVAILABILITY,
      observedAt: "2026-10-06T00:00:00.000Z",
    })
    expect(snapshot.source).toBe("live")
    expect(snapshot.sessions).toBe(heatmapSessions)
    if (snapshot.source === "live") {
      expect(snapshot.observedAt).toBe("2026-10-06T00:00:00.000Z")
    }
  })

  it("renders the availability route from App", () => {
    vi.stubGlobal("window", { location: { pathname: "/availability" } })
    try {
      const html = renderToString(React.createElement(App))
      expect(html).toContain("Disponibilidad de sesiones")
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it("applies availability filters through the domain projection", () => {
    const result = createAvailabilityProjection(
      heatmapSessions,
      SAMPLE_HEATMAP_AVAILABILITY,
      { availability: ["limited"] },
    )

    expect(result.groups).toHaveLength(1)
    expect(result.groups[0]?.sessions[0]?.session.code).toBe("DAT304")
  })
  it("ContextForm renders form inputs and buttons properly", () => {
    const html = renderToString(
      React.createElement(ContextForm, { onSubmit: () => {} }),
    )
    expect(html).toContain("Nombre del Proyecto")
    expect(html).toContain("¿Qué estás construyendo")
    expect(html).toContain("Bedrock")
    expect(html).toContain("Descubrir Mi Knowledge Profile y Gaps")
  })

  it("KnowledgeProfileView renders detected domains and skill badges", () => {
    const html = renderToString(
      React.createElement(KnowledgeProfileView, {
        profile: mockProfile,
        context: mockContext,
      }),
    )
    expect(html).toContain("Perfil de Conocimiento:")
    expect(html).toContain("re:Invent Agent Core")
    expect(html).toContain("ADVANCED")
    expect(html).toContain("Artificial Intelligence")
    expect(html).toContain("BEDROCK")
    expect(html).toContain("DYNAMODB")
  })

  it("KnowledgeGapsList renders gaps with severity badges and descriptions", () => {
    const html = renderToString(
      React.createElement(KnowledgeGapsList, {
        gaps: mockGaps,
      }),
    )
    expect(html).toContain("Knowledge Gaps Identificados")
    expect(html).toContain("CRÍTICA")
    expect(html).toContain("IMPORTANTE")
    expect(html).toContain("Amazon Bedrock AgentCore")
    expect(html).toContain("DynamoDB Single-Table Design")
  })

  it("App renders login requirement view in Live mode when unauthenticated", () => {
    const storageValues = new Map<string, string>([
      ["pathfinder_experience_mode", "live"],
    ])
    vi.stubGlobal("window", {
      location: { pathname: "/" },
      localStorage: {
        getItem: (k: string) => storageValues.get(k) ?? null,
        setItem: (k: string, v: string) => storageValues.set(k, v),
        removeItem: (k: string) => storageValues.delete(k),
      },
    })
    try {
      const html = renderToString(React.createElement(App))
      expect(html).toContain("re:Invent Pathfinder")
      expect(html).toContain("Inicio de sesión requerido (Modo Live)")
      expect(html).toContain("AWS Builder ID")
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it("LearningPathView renders ordered items, covered gaps and conflict state", () => {
    const recommendations: readonly SessionRecommendation[] = [
      {
        sessionId: "sess-a",
        sessionCode: "AIM301",
        title: "Autonomous Agents con Bedrock",
        relevanceScore: 0.92,
        coveredGapIds: ["gap-1"],
        explanation: "Cubre tu brecha en agentes autónomos.",
      },
    ]
    const candidates: readonly SessionCandidate[] = [
      {
        id: "sess-a",
        code: "AIM301",
        title: "Autonomous Agents con Bedrock",
        description: "demo",
        level: 300,
        format: "breakout",
        topics: ["bedrock"],
        schedule: { day: "2026-12-03", startTime: "09:00", endTime: "10:00" },
      },
    ]

    const path = buildLearningPath({
      recommendations,
      candidateSessions: candidates,
      userId: "local-user",
      journeyId: "ctx-1",
    })

    const html = renderToString(
      React.createElement(LearningPathView, {
        learningPath: path,
        recommendations,
      }),
    )

    expect(html).toContain("Tu Learning Path")
    expect(html).toContain("Autonomous Agents con Bedrock")
    // React SSR inserta comentarios entre expresiones JSX; verificamos fragmentos.
    expect(html).toContain("gap(s)")
    expect(html).toContain("relevancia 92%")
    expect(html).toContain("Sin conflictos")
  })

  it("ReflectionForm renders rating, takeaways and related gap options", () => {
    const relatedGaps: readonly KnowledgeGap[] = [
      {
        id: "gap-1",
        topic: "Amazon Bedrock AgentCore",
        description: "orquestación de agentes",
        targetProficiency: "professional",
        severity: "critical",
        status: "open",
        rationale: "proyecto agentic",
        addressedBySessionIds: [],
      },
    ]

    const html = renderToString(
      React.createElement(ReflectionForm, {
        sessionId: "sess-a",
        sessionTitle: "Autonomous Agents con Bedrock",
        userId: "local-user",
        relatedGaps,
        onSubmit: () => {},
      }),
    )

    expect(html).toContain("Reflexión post-sesión")
    expect(html).toContain("Autonomous Agents con Bedrock")
    expect(html).toContain("¿Qué aprendiste?")
    expect(html).toContain("Amazon Bedrock AgentCore")
    expect(html).toContain("Guardar reflexión y adaptar ruta")
  })

  it("LearningPathView shows a reflect action when onReflectionSubmit is provided", () => {
    const recommendations: readonly SessionRecommendation[] = [
      {
        sessionId: "sess-a",
        sessionCode: "AIM301",
        title: "Autonomous Agents con Bedrock",
        relevanceScore: 0.9,
        coveredGapIds: ["gap-1"],
        explanation: "cubre gap-1",
      },
    ]
    const candidates: readonly SessionCandidate[] = [
      {
        id: "sess-a",
        code: "AIM301",
        title: "Autonomous Agents con Bedrock",
        description: "demo",
        level: 300,
        format: "breakout",
        topics: ["bedrock"],
        schedule: { day: "2026-12-03", startTime: "09:00", endTime: "10:00" },
      },
    ]
    const gaps: readonly KnowledgeGap[] = [
      {
        id: "gap-1",
        topic: "Bedrock",
        description: "d",
        targetProficiency: "professional",
        severity: "critical",
        status: "open",
        rationale: "r",
        addressedBySessionIds: [],
      },
    ]

    const path = buildLearningPath({
      recommendations,
      candidateSessions: candidates,
      userId: "local-user",
      journeyId: "ctx-1",
    })

    const html = renderToString(
      React.createElement(LearningPathView, {
        learningPath: path,
        recommendations,
        gaps,
        userId: "local-user",
        onReflectionSubmit: (_r: Reflection) => {},
      }),
    )

    expect(html).toContain("Reflexionar")
  })

  it("LearningReportView renders coverage counts and the next-route pending gaps", () => {
    const initialGaps: readonly KnowledgeGap[] = [
      {
        id: "g1",
        topic: "Amazon Bedrock AgentCore",
        description: "d1",
        targetProficiency: "professional",
        severity: "critical",
        status: "open",
        rationale: "r1",
        addressedBySessionIds: [],
      },
      {
        id: "g2",
        topic: "DynamoDB single-table",
        description: "d2",
        targetProficiency: "professional",
        severity: "important",
        status: "open",
        rationale: "r2",
        addressedBySessionIds: [],
      },
    ]
    const currentGaps: readonly KnowledgeGap[] = [
      { ...initialGaps[0]!, status: "closed", addressedBySessionIds: ["s1"] },
      { ...initialGaps[1]! },
    ]

    const report = buildLearningReport({ initialGaps, currentGaps })
    const html = renderToString(
      React.createElement(LearningReportView, { report }),
    )

    expect(html).toContain("Learning Report")
    expect(html).toContain("Cubiertos:")
    expect(html).toContain("Pendientes:")
    expect(html).toContain("Ruta de aprendizaje posterior")
    expect(html).toContain("DynamoDB single-table")
    expect(html).toContain("Copiar Reporte en Markdown")
    expect(html).toContain("Progreso de Cobertura Formativa")
  })

  it("ReflectionForm renders actionItem input and interactive rating elements", () => {
    const relatedGaps: readonly KnowledgeGap[] = [
      {
        id: "gap-1",
        topic: "Bedrock Guardrails",
        description: "safety filter",
        targetProficiency: "professional",
        severity: "critical",
        status: "open",
        rationale: "security",
        addressedBySessionIds: [],
      },
    ]

    const html = renderToString(
      React.createElement(ReflectionForm, {
        sessionId: "sess-100",
        sessionTitle: "Guardrails Deep Dive",
        userId: "user-1",
        relatedGaps,
        onSubmit: () => {},
      }),
    )

    expect(html).toContain("¿Qué acción implementarás en tu proyecto?")
    expect(html).toContain("Abordado parcialmente")
    expect(html).toContain("Cerrado")
  })

  it("LearningReportView renders documented reflections, action items, and coverage bar", () => {
    const report = buildLearningReport({
      initialGaps: [
        {
          id: "g1",
          topic: "Bedrock AgentCore",
          description: "d1",
          targetProficiency: "professional",
          severity: "critical",
          status: "open",
          rationale: "r1",
          addressedBySessionIds: [],
        },
      ],
      currentGaps: [
        {
          id: "g1",
          topic: "Bedrock AgentCore",
          description: "d1",
          targetProficiency: "professional",
          severity: "critical",
          status: "closed",
          rationale: "r1",
          addressedBySessionIds: ["sess-1"],
        },
      ],
      reflections: [
        {
          id: "refl-1",
          userId: "user-1",
          sessionId: "sess-1",
          rating: 5,
          keyTakeaways: "Gran entendimiento de AgentCore Runtime",
          actionItem: "Implementar agente de atención al cliente",
          gapUpdates: [{ gapId: "g1", newStatus: "closed" }],
          createdAt: "2026-12-02T12:00:00Z",
        },
      ],
    })

    const html = renderToString(
      React.createElement(LearningReportView, { report }),
    )

    expect(html).toContain("100%")
    expect(html).toContain("Compromisos de Implementación en tu Proyecto")
    expect(html).toContain("Implementar agente de atención al cliente")
    expect(html).toContain("Reflexiones Documentadas (1)")
    expect(html).toContain("Gran entendimiento de AgentCore Runtime")
    expect(html).toContain("5 / 5 promedio")
  })

  it("LandingView explains the product, how to run it locally and links to demo/repo", () => {
    const html = renderToString(
      React.createElement(LandingView, {
        onNavigateDemo: () => {},
        onNavigateHome: () => {},
      }),
    )

    expect(html).toContain("Qué es re:Invent Pathfinder")
    expect(html).toContain("El ciclo de valor")
    expect(html).toContain("Cómo lanzar la experiencia local")
    expect(html).toContain("pnpm install")
    expect(html).toContain("pnpm dev")
    expect(html).toContain("https://github.com/Trycatch-tv/reinvent-pathfinder")
    expect(html).toContain("AWS Builder Center")
    expect(html).toContain("Ver demo de disponibilidad")
  })

  it("renders the public about landing route from App without requiring login", () => {
    vi.stubGlobal("window", { location: { pathname: "/about" } })
    try {
      const html = renderToString(React.createElement(App))
      expect(html).toContain("Qué es re:Invent Pathfinder")
      expect(html).toContain("Ver demo de disponibilidad")
      expect(html).not.toContain("Paso 1: ¿Qué estás construyendo?")
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it("links to the about landing from the header on the home route", () => {
    const html = renderToString(React.createElement(App))
    expect(html).toContain('href="/about"')
    expect(html).toContain("Qué es Pathfinder")
  })

  it("renders ModeSelector with Demo and Live options and descriptions", () => {
    const html = renderToString(
      React.createElement(ModeSelector, {
        currentMode: "demo",
        onSelectMode: () => {},
        isAuthenticated: false,
      }),
    )

    expect(html).toContain("Modo Demo")
    expect(html).toContain("Modo Live (re:Invent)")
    expect(html).toContain("Sin credenciales ni llamadas reales a AWS")
    expect(html).toContain("Requiere autenticación con AWS Builder ID")
    expect(html).toContain("✓ Explorando en Demo")
    expect(html).toContain("ACTIVO")
  })

  it("defaults App to Demo mode with badge and context capture form without fake token injection", () => {
    const html = renderToString(React.createElement(App))
    expect(html).toContain("Modo Demo")
    expect(html).toContain("Cambiar a")
    expect(html).toContain("Paso 1: ¿Qué estás construyendo?")
    expect(html).not.toContain("Acceso rápido Demo")
  })

  it("displays Builder ID login gate when in Live mode and unauthenticated", () => {
    const storageValues = new Map<string, string>([
      ["pathfinder_experience_mode", "live"],
    ])
    vi.stubGlobal("window", {
      location: { pathname: "/" },
      localStorage: {
        getItem: (k: string) => storageValues.get(k) ?? null,
        setItem: (k: string, v: string) => storageValues.set(k, v),
        removeItem: (k: string) => storageValues.delete(k),
      },
    })
    try {
      const html = renderToString(React.createElement(App))
      expect(html).toContain("Modo Live")
      expect(html).toContain("Inicio de sesión requerido (Modo Live)")
      expect(html).toContain("Iniciar sesión con AWS Builder ID")
      expect(html).not.toContain("Acceso rápido Demo")
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it("renders availability view in Demo mode with populated sessions and heatmap immediately", () => {
    vi.stubGlobal("window", {
      location: { pathname: "/availability" },
      localStorage: {
        getItem: () => "demo",
        setItem: () => {},
        removeItem: () => {},
      },
    })
    try {
      const html = renderToString(React.createElement(App))
      expect(html).toContain("Disponibilidad de sesiones")
      expect(html).toContain("Building Autonomous Multi-Agent Systems")
      expect(html).toContain("Modo Demo")
      expect(html).toContain("Actualizar disponibilidad")
    } finally {
      vi.unstubAllGlobals()
    }
  })

  describe("AI Traceability components", () => {
    it("renders AITraceBadge for Bedrock inference correctly", () => {
      const trace: StageExecutionTrace = {
        stage: "context_analysis",
        stageName: "Diagnóstico de Competencias",
        engine: "bedrock",
        modelId: "us.anthropic.claude-3-5-sonnet-20241022-v2:0",
        durationMs: 420,
        executedAt: "2026-10-11T12:00:00Z",
        summary: "Análisis generativo de contexto y extracción de gaps",
      }
      const html = renderToString(
        React.createElement(AITraceBadge, { trace })
      )
      expect(html).toContain("Bedrock (claude-3-5-sonnet-20241022-v2:0)")
      expect(html).toContain("420ms")
    })

    it("renders AITraceBadge for heuristic fallback correctly", () => {
      const trace: StageExecutionTrace = {
        stage: "session_ranking",
        stageName: "Ranking de Sesiones",
        engine: "heuristic",
        durationMs: 45,
        executedAt: "2026-10-11T12:00:00Z",
        fallbackReason: "Credenciales de AWS no configuradas",
        summary: "Ranking heurístico local",
      }
      const html = renderToString(
        React.createElement(AITraceBadge, { trace })
      )
      expect(html).toContain("Heurístico Local (Fallback)")
      expect(html).toContain("45ms")
    })

    it("renders AITraceBadge for deterministic execution correctly", () => {
      const trace: StageExecutionTrace = {
        stage: "path_construction",
        stageName: "Construcción de Learning Path",
        engine: "deterministic",
        durationMs: 12,
        executedAt: "2026-10-11T12:00:00Z",
        summary: "Reconciliación determinística de agenda y disponibilidad",
      }
      const html = renderToString(
        React.createElement(AITraceBadge, { trace })
      )
      expect(html).toContain("Determinístico")
      expect(html).toContain("12ms")
    })

    it("renders AITraceBadge fallback when trace is undefined", () => {
      const html = renderToString(
        React.createElement(AITraceBadge, { trace: undefined })
      )
      expect(html).toContain("Pendiente")
    })

    it("renders AITracePanel with multiple stage traces and descriptions when expanded", () => {
      const traces: Partial<Record<ExecutionStage, StageExecutionTrace>> = {
        context_analysis: {
          stage: "context_analysis",
          stageName: "Diagnóstico de Competencias",
          engine: "bedrock",
          modelId: "us.anthropic.claude-3-5-sonnet-20241022-v2:0",
          durationMs: 450,
          executedAt: "2026-10-11T12:00:00Z",
          summary: "Análisis semántico",
        },
        path_construction: {
          stage: "path_construction",
          stageName: "Construcción de Learning Path",
          engine: "deterministic",
          durationMs: 15,
          executedAt: "2026-10-11T12:00:01Z",
          summary: "Algoritmo voraz de horarios",
        },
      }
      const html = renderToString(
        React.createElement(AITracePanel, {
          traces,
          defaultExpanded: true,
        })
      )
      expect(html).toContain("Trazabilidad de Pipeline e IA")
      expect(html).toContain("2 / 5 etapas registradas")
      expect(html).toContain("Diagnóstico de Competencias")
      expect(html).toContain("Construcción de Learning Path")
      expect(html).toContain("Análisis semántico")
      expect(html).toContain("Algoritmo voraz de horarios")
    })
  })

  describe("Learning Path Relevance Tiers and Operational Details", () => {
    it("renders tier badges, operational details and visible justifications", () => {
      const recommendations: readonly SessionRecommendation[] = [
        {
          sessionId: "ses-prim",
          sessionCode: "AIM301",
          title: "Autonomous Agents on Bedrock",
          relevanceScore: 0.95,
          coveredGapIds: ["gap-1"],
          explanation: "Excelente cobertura directa para el stack de agentes",
        },
        {
          sessionId: "ses-alt",
          sessionCode: "DAT202",
          title: "DynamoDB Patterns",
          relevanceScore: 0.72,
          coveredGapIds: ["gap-2"],
          explanation: "Alternativa viable para storage",
        },
        {
          sessionId: "ses-exp",
          sessionCode: "GEN101",
          title: "Intro to Generative AI",
          relevanceScore: 0.45,
          coveredGapIds: ["gap-1"],
          explanation: "Sesión complementaria introductoria",
        },
      ]

      const candidateSessions: readonly SessionCandidate[] = [
        {
          id: "ses-prim",
          code: "AIM301",
          title: "Autonomous Agents on Bedrock",
          description: "Hands-on agents",
          level: 300,
          format: "breakout",
          topics: ["ai"],
          schedule: { day: "2026-12-02", startTime: "10:00", endTime: "11:00" },
          location: { venue: "Venetian", room: "Palazzo A" },
          capacityRemaining: 25,
        },
        {
          id: "ses-alt",
          code: "DAT202",
          title: "DynamoDB Patterns",
          description: "Database patterns",
          level: 200,
          format: "chalk-talk",
          topics: ["database"],
          schedule: { day: "2026-12-02", startTime: "10:30", endTime: "11:30" },
          location: { venue: "Caesars Forum", room: "Summit 1" },
          capacityRemaining: 0,
        },
        {
          id: "ses-exp",
          code: "GEN101",
          title: "Intro to Generative AI",
          description: "Basics of GenAI",
          level: 100,
          format: "breakout",
          topics: ["general"],
        },
      ]

      const path = buildLearningPath({
        recommendations,
        candidateSessions,
        scheduledItems: [
          {
            id: "sched-1",
            type: "reserved",
            title: "Reunión",
            day: "2026-12-02",
            startTime: "10:00",
            endTime: "11:30",
          },
        ],
        userId: "user-1",
        journeyId: "j-1",
      })

      const html = renderToString(
        React.createElement(LearningPathView, {
          learningPath: path,
          recommendations,
          candidateSessions,
          gaps: mockGaps,
        })
      )

      // Tab filters
      expect(html).toContain("Todas (3)")
      expect(html).toContain("⭐ Principales")
      expect(html).toContain("🔄 Alternativas")
      expect(html).toContain("🧭 Exploratorias")

      // Tier badges in items
      expect(html).toContain("⭐ Principal")
      expect(html).toContain("🔄 Alternativa")
      expect(html).toContain("🧭 Exploratoria")

      // Operational info
      expect(html).toContain("Nivel 300")
      expect(html).toContain("Venetian · Palazzo A")
      expect(html).toContain("25 cupos")
      expect(html).toContain("Lleno / Lista de espera")

      // Visible justification
      expect(html).toContain("💡 Justificación:")
      expect(html).toContain("Excelente cobertura directa para el stack de agentes")
      expect(html).toContain("Alternativa viable para storage")
      expect(html).toContain("Sesión complementaria introductoria")
    })
  })
})


