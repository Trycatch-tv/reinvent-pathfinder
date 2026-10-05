import type { KnowledgeGap, KnowledgeGapStatus } from '../types/knowledge-gap.js';
import type { Reflection } from '../types/reflection.js';

/**
 * Transitions a KnowledgeGap to a new status in an immutable way,
 * optionally associating the session ID that addressed it.
 */
export function transitionGapStatus(
  gap: KnowledgeGap,
  newStatus: KnowledgeGapStatus,
  sessionId?: string
): KnowledgeGap {
  const addressedBy = new Set(gap.addressedBySessionIds);
  if (sessionId && (newStatus === 'addressed' || newStatus === 'closed')) {
    addressedBy.add(sessionId);
  }

  return {
    ...gap,
    status: newStatus,
    addressedBySessionIds: Array.from(addressedBy),
  };
}

/**
 * Applies the updates specified in a post-session Reflection to a list of KnowledgeGaps.
 */
export function applyReflectionToGaps(
  gaps: readonly KnowledgeGap[],
  reflection: Reflection
): readonly KnowledgeGap[] {
  const updatesMap = new Map(reflection.gapUpdates.map((u) => [u.gapId, u.newStatus]));

  return gaps.map((gap) => {
    const updatedStatus = updatesMap.get(gap.id);
    if (!updatedStatus) {
      return gap;
    }
    return transitionGapStatus(gap, updatedStatus, reflection.sessionId);
  });
}
