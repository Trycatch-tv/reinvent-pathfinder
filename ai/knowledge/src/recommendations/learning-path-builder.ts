import type {
  SessionRecommendation,
  SessionCandidate,
  LearningPath,
  LearningPathItem,
  ScheduleConflict,
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
}

/**
 * Construye un `LearningPath` del dominio a partir de recomendaciones rankeadas.
 *
 * - Preserva el orden del reranker: `order` sigue la posición en `recommendations`.
 * - Liga cada ítem a los gaps que cubre (`targetGapIds` = `coveredGapIds`).
 * - Reconcilia con la agenda del usuario usando `evaluateScheduleConflicts`
 *   (determinístico, sin AWS; local-first).
 *
 * No invoca red ni Bedrock. Decisión de alcance (WI-013): local-first.
 */
export function buildLearningPath(input: BuildLearningPathInput): LearningPath {
  const {
    recommendations,
    candidateSessions,
    scheduledItems = [],
    userId,
    journeyId,
    includeFavorites = false,
  } = input;

  const items: LearningPathItem[] = recommendations.map((rec, index) => ({
    sessionId: rec.sessionId,
    order: index + 1,
    targetGapIds: rec.coveredGapIds,
    status: 'planned',
  }));

  // Reconciliación de agenda: solo las sesiones que están en el path.
  const pathSessionIds = new Set(items.map((i) => i.sessionId));
  const proposedSessions = candidateSessions.filter((s) => pathSessionIds.has(s.id));

  const evaluated = evaluateScheduleConflicts(proposedSessions, scheduledItems, {
    includeFavorites,
  });
  const conflicts: ScheduleConflict[] = evaluated.map((e) => e.conflict);

  return {
    id: `lp-${journeyId}`,
    userId,
    journeyId,
    items,
    conflicts,
    updatedAt: new Date().toISOString(),
  };
}
