export type ExecutionStage =
  | "context_analysis"
  | "session_ranking"
  | "path_construction"
  | "reflection_adaptation"
  | "report_generation"

export type ProcessingEngine = "bedrock" | "heuristic" | "deterministic"

export interface StageExecutionTrace {
  readonly stage: ExecutionStage
  readonly stageName: string
  readonly engine: ProcessingEngine
  readonly modelId?: string
  readonly summary: string
  readonly executedAt: string
  readonly durationMs?: number
  readonly fallbackReason?: string
  readonly metadata?: Record<string, unknown>
}

export const STAGE_DESCRIPTIONS: Record<
  ExecutionStage,
  { readonly name: string; readonly defaultEngine: ProcessingEngine; readonly description: string }
> = {
  context_analysis: {
    name: "Diagnóstico de Competencias",
    defaultEngine: "bedrock",
    description: "Extracción de Knowledge Profile y brechas desde el contexto arquitectónico.",
  },
  session_ranking: {
    name: "Ranking de Sesiones",
    defaultEngine: "bedrock",
    description: "Reranking semántico de candidatos frente a los gaps identificados.",
  },
  path_construction: {
    name: "Construcción de Learning Path",
    defaultEngine: "deterministic",
    description: "Ordenación determinística y reconciliación de conflictos con la agenda.",
  },
  reflection_adaptation: {
    name: "Reflexión Adaptativa",
    defaultEngine: "heuristic",
    description: "Ajuste heurístico local de gaps y recomendaciones tras feedback de sesión.",
  },
  report_generation: {
    name: "Síntesis de Learning Report",
    defaultEngine: "deterministic",
    description: "Cálculo determinístico de cobertura y proyección de ruta posterior.",
  },
}
