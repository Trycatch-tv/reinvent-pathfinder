import { buildLearningPath } from "@pathfinder/ai-knowledge"
import type {
  KnowledgeGap,
  KnowledgeProfile,
  ProjectContext,
  Reflection,
  SessionCandidate,
  SessionRecommendation,
} from "@pathfinder/domain"
import React from "react"
import { renderToString } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import { App } from "./App.js"
import { ContextForm } from "./components/ContextForm.js"
import { KnowledgeGapsList } from "./components/KnowledgeGapsList.js"
import { KnowledgeProfileView } from "./components/KnowledgeProfileView.js"
import { LearningPathView } from "./components/LearningPathView.js"
import { ReflectionForm } from "./components/ReflectionForm.js"
import { AvailabilityHeatmap, createAvailabilityProjection } from "./components/AvailabilityHeatmap.js"
import { SAMPLE_HEATMAP_AVAILABILITY } from "./fixtures/availability-heatmap.js"
import { SAMPLE_RAW_SESSIONS, normalizeAwsSession } from "@pathfinder/events-client"
import {
  completeBuilderIdCallback,
  initiateBuilderIdLogin,
  logoutBuilderId,
  type BuilderIdAuthClient,
  type TransactionStorage,
} from "./auth/builder-id-transaction.js"

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

  const createStorage = (): TransactionStorage & { readonly values: Map<string, string> } => {
    const values = new Map<string, string>()
    return {
      values,
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => { values.set(key, value) },
      removeItem: (key) => { values.delete(key) },
    }
  }

  const createAuthClient = () => {
    const handleCallback = vi.fn().mockImplementation(({ state, expectedState }) =>
      state === expectedState ? Promise.resolve({}) : Promise.reject(new Error("Invalid state")),
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

    await expect(initiateBuilderIdLogin(client, storage)).resolves.toBe("https://builder-id.example/authorize")
    expect([...storage.values.entries()]).toEqual([
      ["pathfinder.builder-id.state", "csrf-state"],
      ["pathfinder.builder-id.verifier", "pkce-verifier"],
    ])
  })

  it("completes a valid callback once and clears the PKCE transaction", async () => {
    const storage = createStorage()
    const client = createAuthClient()
    await initiateBuilderIdLogin(client, storage)

    await expect(completeBuilderIdCallback(client, storage, new URLSearchParams("code=authorization-code&state=csrf-state"))).resolves.toBe("authenticated")
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

    await expect(completeBuilderIdCallback(client, storage, new URLSearchParams("code=authorization-code&state=wrong"))).resolves.toBe("invalid-callback")
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
      }),
    )

    expect(html).toContain("Matriz de disponibilidad por horario y venue")
    expect(html).toContain("Building Autonomous Multi-Agent Systems with Amazon Bedrock AgentCore: Disponible")
    expect(html).toContain("Disponibilidad desconocida")
    expect(html).toContain("Palazzo Ballroom E")
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

  it("App renders step 1 capture view initially", () => {
    const html = renderToString(React.createElement(App))
    expect(html).toContain("re:Invent Pathfinder")
    expect(html).toContain("Paso 1: ¿Qué estás construyendo?")
    expect(html).toContain("Descubrir Mi Knowledge Profile y Gaps")
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
})
