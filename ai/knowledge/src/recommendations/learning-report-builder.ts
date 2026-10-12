import type {
  KnowledgeGap,
  KnowledgeGapSeverity,
  KnowledgeGapStatus,
  Reflection,
} from '@pathfinder/domain';

export type GapCoverage = 'covered' | 'partial' | 'pending';

export interface LearningReportGap {
  readonly gapId: string;
  readonly topic: string;
  readonly severity: KnowledgeGapSeverity;
  readonly initialStatus: KnowledgeGapStatus;
  readonly finalStatus: KnowledgeGapStatus;
  readonly coverage: GapCoverage;
  readonly addressedBySessionIds: readonly string[];
  readonly recommendedAction?: string;
}

export interface LearningReportCounts {
  readonly covered: number;
  readonly partial: number;
  readonly pending: number;
  readonly total: number;
}

export interface ReflectionSummaryItem {
  readonly sessionId: string;
  readonly rating: number;
  readonly takeaways: string;
  readonly actionItem?: string;
  readonly createdAt: string;
}

export interface ReflectionsSummary {
  readonly totalReflections: number;
  readonly averageRating: number;
  readonly items: readonly ReflectionSummaryItem[];
  readonly keyActionItems: readonly string[];
}

export interface LearningReport {
  readonly counts: LearningReportCounts;
  /** Porcentaje de cobertura efectiva (0-100%). */
  readonly coveragePercentage: number;
  /** Síntesis ejecutiva sustentada en los hechos del Journey. */
  readonly executiveSummary: string;
  readonly gaps: readonly LearningReportGap[];
  /** Gaps aún pendientes, priorizados por severidad y con acciones recomendadas. */
  readonly nextRoute: readonly LearningReportGap[];
  /** Síntesis consolidada de reflexiones post-sesión. */
  readonly reflectionsSummary: ReflectionsSummary;
  readonly generatedAt: string;
}

const SEVERITY_ORDER: Record<KnowledgeGapSeverity, number> = {
  critical: 0,
  important: 1,
  'nice-to-have': 2,
};

const RECOMMENDED_ACTIONS: Record<KnowledgeGapSeverity, string> = {
  critical: 'Priorizar laboratorio hands-on o sesión bajo demanda en AWS Builder Center.',
  important: 'Consultar documentación oficial y repositorios de referencia en GitHub.',
  'nice-to-have': 'Revisar grabaciones de re:Invent y artículos de AWS Architecture Blog.',
};

/** Mapea el estado de dominio de un gap a su cobertura de aprendizaje. */
export function classifyCoverage(status: KnowledgeGapStatus): GapCoverage {
  switch (status) {
    case 'closed':
      return 'covered';
    case 'addressed':
      return 'partial';
    case 'open':
    default:
      return 'pending';
  }
}

export interface BuildLearningReportInput {
  /** Gaps al inicio (p. ej. al construir el Learning Path). */
  readonly initialGaps: readonly KnowledgeGap[];
  /** Gaps al cierre del evento, tras aplicar reflexiones. */
  readonly currentGaps: readonly KnowledgeGap[];
  /** Historial opcional de reflexiones documentadas durante el Journey. */
  readonly reflections?: readonly Reflection[];
}

/**
 * Genera el Learning Report (Journey 6): contrasta el estado inicial de los gaps
 * con el actual, clasifica cada uno como cubierto/parcial/pendiente, consolida las
 * reflexiones registradas, calcula cobertura porcentual y produce una ruta posterior
 * accionable con recomendaciones de estudio.
 *
 * Determinístico y local-first: opera sobre los hechos del Journey.
 */
export function buildLearningReport(input: BuildLearningReportInput): LearningReport {
  const { initialGaps, currentGaps, reflections = [] } = input;
  const initialStatusById = new Map(initialGaps.map((g) => [g.id, g.status]));

  const gaps: LearningReportGap[] = currentGaps.map((gap) => {
    const initialStatus = initialStatusById.get(gap.id) ?? gap.status;
    const coverage = classifyCoverage(gap.status);
    return {
      gapId: gap.id,
      topic: gap.topic,
      severity: gap.severity,
      initialStatus,
      finalStatus: gap.status,
      coverage,
      addressedBySessionIds: gap.addressedBySessionIds,
      recommendedAction: coverage === 'pending' ? RECOMMENDED_ACTIONS[gap.severity] : undefined,
    };
  });

  const counts: LearningReportCounts = {
    covered: gaps.filter((g) => g.coverage === 'covered').length,
    partial: gaps.filter((g) => g.coverage === 'partial').length,
    pending: gaps.filter((g) => g.coverage === 'pending').length,
    total: gaps.length,
  };

  const coveragePercentage =
    counts.total === 0
      ? 100
      : Math.round(((counts.covered + counts.partial * 0.5) / counts.total) * 100);

  const reflectionItems: ReflectionSummaryItem[] = reflections.map((r) => ({
    sessionId: r.sessionId,
    rating: r.rating,
    takeaways: r.keyTakeaways,
    actionItem: r.actionItem,
    createdAt: r.createdAt,
  }));

  const averageRating =
    reflectionItems.length > 0
      ? Number(
          (
            reflectionItems.reduce((acc, curr) => acc + curr.rating, 0) /
            reflectionItems.length
          ).toFixed(1)
        )
      : 0;

  const keyActionItems = reflectionItems
    .map((r) => r.actionItem)
    .filter((a): a is string => Boolean(a && a.trim().length > 0));

  const reflectionsSummary: ReflectionsSummary = {
    totalReflections: reflectionItems.length,
    averageRating,
    items: reflectionItems,
    keyActionItems,
  };

  const nextRoute = gaps
    .filter((g) => g.coverage === 'pending')
    .slice()
    .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);

  const executiveSummary =
    counts.total === 0
      ? 'No se identificaron brechas en el diagnóstico inicial.'
      : `Se alcanzó un ${coveragePercentage}% de cobertura efectiva en re:Invent (${counts.covered} brecha(s) cerradas, ${counts.partial} parciales y ${counts.pending} pendientes de estudio). Se documentaron ${reflectionsSummary.totalReflections} reflexiones con una valoración media de ${averageRating}/5.`;

  return {
    counts,
    coveragePercentage,
    executiveSummary,
    gaps,
    nextRoute,
    reflectionsSummary,
    generatedAt: new Date().toISOString(),
  };
}
