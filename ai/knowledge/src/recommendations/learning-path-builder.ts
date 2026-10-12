import type {
  SessionRecommendation,
  SessionCandidate,
  LearningPath,
  LearningPathItem,
  ScheduleConflict,
  RelevanceTier,
} from '@pathfinder/domain';
import {
  evaluateScheduleConflicts,
  type UserScheduleItem,
} from '@pathfinder/events-client';

export interface BuildLearningPathInput {
  /** Recomendaciones ya rankeadas (orden descendente de relevancia). */
  readonly recommendations: readonly SessionRecommendation[];
  /** Candidatos de sesión originales, usados para reconciliar la agenda. */
  readonly candidateSessions: readonly SessionCandidate[];
  /** Agenda personal del usuario (reservas, favoritos, personal time). Opcional. */
  readonly scheduledItems?: readonly UserScheduleItem[];
  readonly userId: string;
  readonly journeyId: string;
  /** Incluir favoritos al evaluar conflictos (por defecto solo compromisos duros). */
  readonly includeFavorites?: boolean;
  /** Umbrales configurables para clasificar el tier de relevancia (determinísticos). */
  readonly tierThresholds?: {
    readonly primaryMin?: number;
    readonly alternativeMin?: number;
  };
}

/**
 * Construye un `LearningPath` del dominio a partir de recomendaciones rankeadas.
 *
 * - Preserva el orden del reranker: `order` sigue la posición en `recommendations`.
 * - Liga cada ítem a los gaps que cubre (`targetGapIds` = `coveredGapIds`).
 * - Reconcilia con la agenda del usuario usando `evaluateScheduleConflicts`
 *   (determinístico, sin AWS; local-first).
 * - Clasifica determinísticamente cada sesión en un `tier` de relevancia:
 *   - 'primary': alta relevancia (>= 0.70) sin conflictos de agenda.
 *   - 'alternative': sesiones con conflicto de agenda o relevancia moderada (>= 0.60).
 *   - 'exploratory': baja relevancia (< 0.60), conservadas sin descarte arbitrario.
 *
 * No invoca red ni Bedrock. Decisión de alcance (WI-013, WI-036): local-first.
 */
export function buildLearningPath(input: BuildLearningPathInput): LearningPath {
  const {
    recommendations,
    candidateSessions,
    scheduledItems = [],
    userId,
    journeyId,
    includeFavorites = false,
    tierThresholds,
  } = input;

  const primaryMin = tierThresholds?.primaryMin ?? 0.70;
  const alternativeMin = tierThresholds?.alternativeMin ?? 0.60;

  // Reconciliación de agenda: sesiones que están en las recomendaciones.
  const pathSessionIds = new Set(recommendations.map((r) => r.sessionId));
  const proposedSessions = candidateSessions.filter((s) => pathSessionIds.has(s.id));

  const evaluated = evaluateScheduleConflicts(proposedSessions, scheduledItems, {
    includeFavorites,
  });
  const conflicts: ScheduleConflict[] = evaluated.map((e) => e.conflict);

  const conflictSessionIds = new Set<string>();
  for (const c of conflicts) {
    conflictSessionIds.add(c.sessionAId);
    conflictSessionIds.add(c.sessionBId);
  }

  const items: LearningPathItem[] = recommendations.map((rec, index) => {
    const hasConflict = conflictSessionIds.has(rec.sessionId);
    let tier: RelevanceTier;

    if (rec.relevanceScore < alternativeMin) {
      tier = 'exploratory';
    } else if (hasConflict || rec.relevanceScore < primaryMin) {
      tier = 'alternative';
    } else {
      tier = 'primary';
    }

    return {
      sessionId: rec.sessionId,
      order: index + 1,
      targetGapIds: rec.coveredGapIds,
      status: 'planned',
      tier,
    };
  });

  return {
    id: `lp-${journeyId}`,
    userId,
    journeyId,
    items,
    conflicts,
    updatedAt: new Date().toISOString(),
  };
}
