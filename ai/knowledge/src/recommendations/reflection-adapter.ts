import type {
  Reflection,
  KnowledgeGap,
  SessionCandidate,
  SessionRecommendation,
  LearningPath,
  ProjectContext,
} from '@pathfinder/domain';
import { applyReflectionToGaps } from '@pathfinder/domain';
import type { UserScheduleItem } from '@pathfinder/events-client';
import { HeuristicSessionReranker } from './session-reranker.js';
import { buildLearningPath } from './learning-path-builder.js';

export interface AdaptLearningPathInput {
  /** Reflexión post-sesión del usuario (rating, takeaways, gapUpdates). */
  readonly reflection: Reflection;
  /** Gaps actuales, antes de aplicar la reflexión. */
  readonly gaps: readonly KnowledgeGap[];
  /** Catálogo de sesiones candidatas (local-first / fixtures). */
  readonly candidateSessions: readonly SessionCandidate[];
  /** Contexto de proyecto, para el reranker. Opcional. */
  readonly projectContext?: ProjectContext;
  /** Agenda personal para reconciliar conflictos. Opcional. */
  readonly scheduledItems?: readonly UserScheduleItem[];
  readonly userId: string;
  readonly journeyId: string;
}

export interface AdaptLearningPathResult {
  /** Gaps tras aplicar la reflexión (estados transicionados). */
  readonly updatedGaps: readonly KnowledgeGap[];
  /** Recomendaciones recalculadas con los gaps actualizados. */
  readonly recommendations: readonly SessionRecommendation[];
  /** Learning Path reconstruido. */
  readonly learningPath: LearningPath;
}

/**
 * Cierra el ciclo adaptativo (Journey 5): aplica una reflexión post-sesión a los
 * Knowledge Gaps, recalcula las recomendaciones con los gaps actualizados y
 * reconstruye el Learning Path.
 *
 * Determinístico y local-first: usa el reranker heurístico, sin red ni AWS.
 */
export async function adaptLearningPathFromReflection(
  input: AdaptLearningPathInput,
): Promise<AdaptLearningPathResult> {
  const {
    reflection,
    gaps,
    candidateSessions,
    projectContext,
    scheduledItems,
    userId,
    journeyId,
  } = input;

  // 1. Aplicar la reflexión a los gaps (lógica de dominio).
  const updatedGaps = applyReflectionToGaps(gaps, reflection);

  // 2. Recalcular recomendaciones con los gaps actualizados.
  //    Solo se consideran gaps aún no cerrados para el ranking.
  const openGaps = updatedGaps.filter((g) => g.status === 'open');
  const reranker = new HeuristicSessionReranker();
  const ranked = await reranker.rank({
    projectContext,
    knowledgeGaps: openGaps.length > 0 ? openGaps : updatedGaps,
    candidateSessions,
  });

  // 3. Reconstruir el Learning Path.
  const learningPath = buildLearningPath({
    recommendations: ranked.recommendations,
    candidateSessions,
    scheduledItems,
    userId,
    journeyId,
  });

  return {
    updatedGaps,
    recommendations: ranked.recommendations,
    learningPath,
  };
}
