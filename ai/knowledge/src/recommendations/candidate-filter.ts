import type { SessionCandidate, SessionLevel, SessionFormat } from '@pathfinder/domain';

export interface CandidateFilterCriteria {
  readonly targetLevels?: readonly SessionLevel[];
  readonly preferredFormats?: readonly SessionFormat[];
  readonly includedTopics?: readonly string[];
  readonly excludedSessionCodes?: readonly string[];
}

/**
 * Deterministic pre-filtering of session candidates.
 * Reduces large catalogs of sessions to a targeted candidate set based on:
 * - Session level (e.g. 300, 400 for advanced/expert)
 * - Preferred formats (breakout, workshop, chalk-talk, etc.)
 * - Topic intersections (if specified)
 * - Excluded session codes (e.g. already booked or dismissed)
 */
export class CandidateFilter {
  /**
   * Filters a list of session candidates according to the given criteria.
   * If a criterion is omitted or empty, it is not applied (open filter).
   */
  public filter(
    sessions: readonly SessionCandidate[],
    criteria: CandidateFilterCriteria = {},
  ): SessionCandidate[] {
    const { targetLevels, preferredFormats, includedTopics, excludedSessionCodes } = criteria;

    const excludedCodesSet = excludedSessionCodes && excludedSessionCodes.length > 0
      ? new Set(excludedSessionCodes.map((c) => c.toUpperCase()))
      : null;

    const targetLevelsSet = targetLevels && targetLevels.length > 0
      ? new Set(targetLevels)
      : null;

    const preferredFormatsSet = preferredFormats && preferredFormats.length > 0
      ? new Set(preferredFormats)
      : null;

    const normalizedTopics = includedTopics && includedTopics.length > 0
      ? includedTopics.map((t) => t.toLowerCase())
      : null;

    return sessions.filter((session) => {
      // 1. Exclude explicitly rejected session codes
      if (excludedCodesSet && excludedCodesSet.has(session.code.toUpperCase())) {
        return false;
      }

      // 2. Filter by target levels
      if (targetLevelsSet && !targetLevelsSet.has(session.level)) {
        return false;
      }

      // 3. Filter by preferred formats
      if (preferredFormatsSet && !preferredFormatsSet.has(session.format)) {
        return false;
      }

      // 4. Filter by topics (must match at least one topic if specified)
      if (normalizedTopics) {
        const sessionTopics = session.topics.map((t) => t.toLowerCase());
        const sessionTitle = session.title.toLowerCase();
        const sessionDesc = session.description.toLowerCase();

        const matchesTopic = normalizedTopics.some((topic) =>
          sessionTopics.includes(topic) ||
          sessionTitle.includes(topic) ||
          sessionDesc.includes(topic),
        );

        if (!matchesTopic) {
          return false;
        }
      }

      return true;
    });
  }
}
