export interface RawAwsSession {
  /** Legacy fixture field retained while local-first examples are supported. */
  readonly session_id?: string;
  /** Official AWS Events ListSessions field. */
  readonly sessionId?: string;
  readonly session_code?: string;
  readonly abbreviation?: string;
  readonly title?: string;
  readonly description?: string;
  readonly abstract?: string;
  readonly level?: string | number;
  readonly session_type?: string;
  readonly track?: string;
  readonly topics?: readonly string[];
  readonly start_time?: string;
  readonly end_time?: string;
  readonly day?: string;
  readonly venue?: string;
  readonly room?: string;
  readonly capacity_remaining?: number;
  readonly type?: string;
  readonly isReservable?: boolean;
  readonly seatAvailability?: AwsSeatAvailability | string;
  readonly sessionTime?: {
    /** Official ListSessions fields. */
    readonly date?: string;
    readonly time?: string;
    readonly length?: string;
    readonly timezone?: string;
    /** Tolerated for older fixtures and alternate providers. */
    readonly startTime?: string;
    readonly endTime?: string;
  };
}

export type AwsSeatAvailability = 'available' | 'limited' | 'veryLimited' | 'unavailable' | 'walkUp';

export interface RawAwsCatalogResponse {
  readonly data: readonly RawAwsSession[];
  readonly next_cursor?: string;
  readonly total_count?: number;
}

/** Official response shape for GET /v1/events/{eventId}/sessions. */
export interface RawAwsListSessionsResponse {
  readonly items: readonly RawAwsSession[];
  readonly totalCount?: number;
  readonly nextToken?: string;
}

export interface CatalogQueryParams {
  readonly limit?: number;
  readonly cursor?: string;
  readonly topic?: string;
  readonly level?: number;
  readonly search?: string;
  /** Official AWS Events pagination token. */
  readonly nextToken?: string;
  /** Local observation instant shared by every page in a snapshot. */
  readonly observedAt?: string;
}
