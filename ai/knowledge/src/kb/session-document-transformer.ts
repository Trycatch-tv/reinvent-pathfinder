import type { SessionCandidate } from '@pathfinder/domain';
import type { BedrockKnowledgeDocument } from './types.js';

export class SessionDocumentTransformer {
  /**
   * Transforms a single SessionCandidate into a BedrockKnowledgeDocument
   * structured for semantic embedding and vector retrieval.
   */
  public static transformOne(session: SessionCandidate): BedrockKnowledgeDocument {
    const topicsFormatted = session.topics.length > 0
      ? session.topics.join(', ')
      : 'General AWS Architecture';

    // Construct enriched semantic content chunk for embeddings
    const contentParts = [
      `Session Code: ${session.code}`,
      `Title: ${session.title}`,
      `Format: ${session.format}`,
      `Level: ${session.level}`,
      `Topics: ${topicsFormatted}`,
      '',
      `Description:`,
      session.description || 'No description provided.',
    ];

    if (session.schedule) {
      contentParts.push(
        '',
        `Schedule: Day ${session.schedule.day}, from ${session.schedule.startTime} to ${session.schedule.endTime}`
      );
    }

    if (session.location?.venue) {
      const roomStr = session.location.room ? `, Room: ${session.location.room}` : '';
      contentParts.push(`Venue: ${session.location.venue}${roomStr}`);
    }

    return {
      id: `doc-${session.id}`,
      content: contentParts.join('\n'),
      metadata: {
        sessionId: session.id,
        code: session.code,
        level: session.level,
        format: session.format,
        topics: session.topics,
        venue: session.location?.venue,
        day: session.schedule?.day,
        startTime: session.schedule?.startTime,
        endTime: session.schedule?.endTime,
      },
    };
  }

  /**
   * Transforms an array of SessionCandidate objects into knowledge documents.
   */
  public static transform(sessions: readonly SessionCandidate[]): readonly BedrockKnowledgeDocument[] {
    return sessions.map((s) => this.transformOne(s));
  }
}
