import { buildLearningPath } from "@pathfinder/ai-knowledge"
import type {
  KnowledgeGap,
  KnowledgeProfile,
  ProjectContext,
  SessionCandidate,
  SessionRecommendation,
} from "@pathfinder/domain"
import React from "react"
import { renderToString } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { App } from "./App.js"
import { ContextForm } from "./components/ContextForm.js"
import { KnowledgeGapsList } from "./components/KnowledgeGapsList.js"
import { KnowledgeProfileView } from "./components/KnowledgeProfileView.js"
import { LearningPathView } from "./components/LearningPathView.js"

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
})
