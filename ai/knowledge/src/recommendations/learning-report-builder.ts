import type {
  KnowledgeGap,
  KnowledgeGapSeverity,
  KnowledgeGapStatus,
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
}

export interface LearningReportCounts {
  readonly covered: number;
  readonly partial: number;
  readonly pending: number;
  readonly total: number;
}

export interface LearningReport {
  readonly counts: LearningReportCounts;
  readonly gaps: readonly LearningReportGap[];
  /** Gaps aún pendientes, priorizados por severidad: la ruta de aprendizaje posterior. */
  readonly nextRoute: readonly LearningReportGap[];
  readonly generatedAt: string;
}

const SEVERITY_ORDER: Record<KnowledgeGapSeverity, number> = {
  critical: 0,
  important: 1,
  'nice-to-have': 2,
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
}

/**
 * Genera el Learning Report (Journey 6): contrasta el estado inicial de los gaps
 * con el actual, clasifica cada uno como cubierto/parcial/pendiente y produce una
 * ruta posterior con los pendientes priorizados por severidad.
 *
 * Determinístico y local-first: opera solo sobre el `status` de los gaps.
 */
export function buildLearningReport(input: BuildLearningReportInput): LearningReport {
  const initialStatusById = new Map(input.initialGaps.map((g) => [g.id, g.status]));

  const gaps: LearningReportGap[] = input.currentGaps.map((gap) => {
    const initialStatus = initialStatusById.get(gap.id) ?? gap.status;
    return {
      gapId: gap.id,
      topic: gap.topic,
      severity: gap.severity,
      initialStatus,
      finalStatus: gap.status,
      coverage: classifyCoverage(gap.status),
      addressedBySessionIds: gap.addressedBySessionIds,
    };
  });

  const counts: LearningReportCounts = {
    covered: gaps.filter((g) => g.coverage === 'covered').length,
    partial: gaps.filter((g) => g.coverage === 'partial').length,
    pending: gaps.filter((g) => g.coverage === 'pending').length,
    total: gaps.length,
  };

  const nextRoute = gaps
    .filter((g) => g.coverage === 'pending')
    .slice()
    .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);

  return {
    counts,
    gaps,
    nextRoute,
    generatedAt: new Date().toISOString(),
  };
}
